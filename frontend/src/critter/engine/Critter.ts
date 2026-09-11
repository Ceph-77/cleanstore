/**
 * L'entité animée : assemble physique + FSM + Brain + bruit, et expose une
 * surface simple (`update`, `render`, `sendEvent`, `setPointer`, `resize`).
 *
 * Ne dessine rien elle-même : `render()` délègue à une fonction `Skin`.
 */
import type { AppEvent, Mood, RenderFrame, StateName, Vec2, View } from "../core/types";
import { makeRng, type Rng } from "../core/rng";
import { makeNoise, type Noise } from "../core/noise";
import { Body } from "./Physics";
import { Fsm } from "../behavior/Fsm";
import { Brain } from "../behavior/Brain";
import { STATES } from "../behavior/states";
import type { CritterContext, Expression, Pointer } from "../behavior/context";
import { blobSkin, type Skin, type SkinInput } from "../render/skins";
import { copy } from "../core/vec2";

export interface CritterOptions {
  view: View;
  seed?: string | number;
  position?: Vec2;
  skin?: Skin;
  /** Humeur de départ. Défaut { arousal: 0.2, valence: 0 }. */
  mood?: Partial<Mood>;
}

const REST: Mood = { arousal: 0.15, valence: 0 };
const clamp = (n: number, lo: number, hi: number): number => (n < lo ? lo : n > hi ? hi : n);

/** Durée d'un changement de skin (Transformers-esque : pas un cut instantané). */
const TRANSFORM_DURATION = 0.55;

/**
 * Dessine la bascule entre deux skins : l'ancien se rétracte en tournant sur
 * lui-même, un éclair mécanique marque le pivot, le nouveau se déploie en
 * tournant en sens inverse jusqu'à sa taille normale. Générique — ne connaît
 * ni le blob ni les machines, seulement des fonctions `Skin`.
 */
function drawSkinTransform(
  g: CanvasRenderingContext2D,
  input: SkinInput,
  from: Skin,
  to: Skin,
  progress: number,
): void {
  const { pos } = input;
  const zeroed: SkinInput = { ...input, pos: { x: 0, y: 0 } };
  g.save();
  g.translate(pos.x, pos.y);

  if (progress < 0.5) {
    const q = progress / 0.5;
    g.save();
    g.globalAlpha = 1 - q * 0.75;
    g.rotate(q * Math.PI * 2.2);
    const s = Math.max(0.02, 1 - q);
    g.scale(s, s);
    from(g, zeroed);
    g.restore();
  } else {
    const q = (progress - 0.5) / 0.5;
    g.save();
    g.globalAlpha = 0.25 + q * 0.75;
    g.rotate((1 - q) * -Math.PI * 1.4);
    const s = Math.max(0.02, q);
    g.scale(s, s);
    to(g, zeroed);
    g.restore();
  }

  // éclair mécanique au pivot, culmine à mi-transformation
  const burst = Math.max(0, 1 - Math.abs(progress - 0.5) * 2.4);
  if (burst > 0.01) {
    g.save();
    g.globalAlpha = burst;
    g.strokeStyle = "#e3a94c";
    g.lineWidth = 3;
    g.lineCap = "round";
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const len = 10 + burst * 28;
      g.beginPath();
      g.moveTo(Math.cos(a) * 6, Math.sin(a) * 6);
      g.lineTo(Math.cos(a) * len, Math.sin(a) * len);
      g.stroke();
    }
    g.fillStyle = "rgba(253,252,249,0.9)";
    g.beginPath();
    g.arc(0, 0, 4 + burst * 9, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }

  g.restore();
}

export class Critter {
  private readonly rng: Rng;
  private readonly noise: Noise;
  private readonly body: Body;
  private readonly fsm: Fsm<CritterContext, StateName, AppEvent>;
  private readonly brain: Brain;
  private readonly ctx: CritterContext;
  private skin: Skin;
  /** Skin quitté au dernier `setSkin`, encore dessiné pendant la transformation. */
  private prevSkin: Skin | null = null;
  /** Secondes écoulées dans la transformation courante ; ≥ TRANSFORM_DURATION = terminée. */
  private transformT = TRANSFORM_DURATION;

  /** Position au pas précédent, pour l'interpolation au rendu. */
  private readonly prevPos: Vec2;

  constructor(opts: CritterOptions) {
    const seed = opts.seed ?? "critter";
    this.rng = makeRng(seed);
    this.noise = makeNoise(`${seed}:noise`);
    this.skin = opts.skin ?? blobSkin;

    const start = opts.position ?? {
      x: opts.view.width / 2,
      y: opts.view.height / 2,
    };
    this.body = new Body({ position: start, damping: 0.9, maxSpeed: 200, maxForce: 1200 });
    this.prevPos = { ...start };

    const mood: Mood = {
      arousal: opts.mood?.arousal ?? 0.2,
      valence: opts.mood?.valence ?? 0,
    };
    const expr: Expression = {
      squash: 0,
      spin: 0,
      shake: 0,
      sparkle: false,
      puff: false,
    };
    const pointer: Pointer = { pos: { x: start.x, y: start.y }, inside: false, down: false };

    this.ctx = {
      body: this.body,
      view: opts.view,
      rng: this.rng,
      noise: this.noise,
      mood,
      pointer,
      expr,
      t: 0,
      timeInState: 0,
      wanderSeed: this.rng.range(0, 1000),
      target: { ...start },
      lastEventAt: {},
      lastErrorAt: { ...start },
      nudgeMood: (dA, dV) => {
        // dA / dV sont des taux « par seconde » ; l'appel est fait chaque pas fixe.
        mood.arousal = clamp(mood.arousal + dA / 60, 0, 1);
        mood.valence = clamp(mood.valence + dV / 60, -1, 1);
      },
      setTarget: (x, y) => {
        this.ctx.target.x = x;
        this.ctx.target.y = y;
      },
    };

    this.fsm = new Fsm(this.ctx, STATES, { initial: "idle" });
    this.brain = new Brain(this.rng);
  }

  get state(): StateName {
    return this.fsm.state;
  }
  get mood(): Readonly<Mood> {
    return this.ctx.mood;
  }
  get position(): Readonly<Vec2> {
    return this.body.position;
  }

  /** Change de skin — la bascule se dessine (rétraction/éclair/déploiement), pas de cut. */
  setSkin(skin: Skin): void {
    if (skin === this.skin) return;
    this.prevSkin = this.skin;
    this.skin = skin;
    this.transformT = 0;
  }

  resize(view: View): void {
    (this.ctx as { view: View }).view = view;
  }

  setPointer(x: number, y: number, inside: boolean, down: boolean): void {
    this.ctx.pointer.pos.x = x;
    this.ctx.pointer.pos.y = y;
    this.ctx.pointer.inside = inside;
    this.ctx.pointer.down = down;
  }

  /** Injecte un stimulus applicatif. */
  sendEvent(e: AppEvent): void {
    const t = this.ctx.t;
    this.ctx.lastEventAt[e.type] = t;
    if (e.at) {
      if (e.type === "error") copy(this.ctx.lastErrorAt, e.at);
      if (e.type === "click") copy(this.ctx.pointer.pos, e.at);
    }
    this.brain.defer(1.5); // laisse la réaction respirer avant le prochain choix ambiant
    this.fsm.send(e);
  }

  /** Un pas de simulation (appelé à pas fixe par la RenderLoop). */
  update(dt: number, elapsed: number): void {
    copy(this.prevPos, this.body.position);

    this.ctx.t = elapsed;
    this.ctx.timeInState = this.fsm.timeInState;

    const ambient = this.brain.tick(dt, this.fsm.state, this.fsm.timeInState, this.ctx.mood);
    if (ambient) this.fsm.transitionTo(ambient);

    this.fsm.update(dt);

    // retour passif de l'humeur vers le repos
    const relax = 1 - Math.pow(0.6, dt);
    this.ctx.mood.arousal += (REST.arousal - this.ctx.mood.arousal) * relax * 0.5;
    this.ctx.mood.valence += (REST.valence - this.ctx.mood.valence) * relax * 0.5;

    // amortissement de la rotation expressive
    this.ctx.expr.spin *= Math.pow(0.82, dt * 60);

    this.body.integrate(dt);

    if (this.transformT < TRANSFORM_DURATION) this.transformT += dt;
  }

  /** Rendu d'une frame écran. `frame.alpha` interpole depuis le dernier pas. */
  render(g: CanvasRenderingContext2D, frame: RenderFrame): void {
    const a = frame.alpha;
    const ix = this.prevPos.x + (this.body.position.x - this.prevPos.x) * a;
    const iy = this.prevPos.y + (this.body.position.y - this.prevPos.y) * a;

    const input: SkinInput = {
      frame,
      pos: { x: ix, y: iy },
      velocity: this.body.velocity,
      state: this.fsm.state,
      mood: this.ctx.mood,
      expr: this.ctx.expr,
    };

    if (this.prevSkin && this.transformT < TRANSFORM_DURATION) {
      drawSkinTransform(g, input, this.prevSkin, this.skin, this.transformT / TRANSFORM_DURATION);
    } else {
      this.prevSkin = null;
      this.skin(g, input);
    }

    // les impulsions visuelles « one-shot » sont consommées après lecture
    this.ctx.expr.sparkle = false;
    this.ctx.expr.puff = false;
  }
}
