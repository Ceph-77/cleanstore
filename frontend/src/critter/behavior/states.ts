/**
 * Les sept états comportementaux.
 *
 * Ambiants (choisis par le Brain) :
 *   idle · curious · distracted · working
 * Réactifs (déclenchés par un événement) :
 *   success · error · poked
 *
 * Chaque état ne fait que : régler une cible / une force de steering, teinter
 * l'humeur, poser une expression. Aucun n'accède au canvas.
 */
import type { FsmState } from "./Fsm";
import type { CritterContext } from "./context";
import type { AppEvent, StateName, Vec2 } from "../core/types";
import { seek, arrive, containWithin } from "../engine/Physics";

type S = FsmState<CritterContext, StateName, AppEvent>;

const center = (ctx: CritterContext): [number, number] => [ctx.view.width / 2, ctx.view.height / 2];
const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);

/** Force de dérive organique issue du bruit de Perlin (fluide, non répétitive). */
function wanderForce(ctx: CritterContext, freq: number, amp: number): void {
  const s = ctx.wanderSeed;
  const nx = ctx.noise.noise2(ctx.t * freq + s, s * 0.37);
  const ny = ctx.noise.noise2(s * 0.91, ctx.t * freq + s + 100);
  ctx.body.applyForce(nx * amp, ny * amp);
}

const edges = (ctx: CritterContext): void =>
  containWithin(ctx.body, ctx.view.width, ctx.view.height, 28);

/** Réaction commune des états ambiants aux stimuli applicatifs. */
function reactCommon(ctx: CritterContext, e: AppEvent): StateName | void {
  switch (e.type) {
    case "success":
      return "success";
    case "error":
      return "error";
    case "click":
      return "poked";
    case "wait":
      return ctx.rng.chance(0.7) ? "distracted" : "idle";
    case "focus":
      return "curious";
    default:
      return undefined;
  }
}

// --- ambiants --------------------------------------------------------------

const idle: S = {
  name: "idle",
  onEnter(ctx) {
    ctx.expr.squash = 0;
  },
  update(ctx) {
    wanderForce(ctx, 0.12, 40);
    seek(ctx.body, ...center(ctx), 0.015); // léger rappel vers le centre
    edges(ctx);
    ctx.nudgeMood(-0.2, 0);
    ctx.expr.squash = Math.sin(ctx.t * 1.6 + ctx.wanderSeed) * 0.06; // respiration
  },
  onEvent: reactCommon,
};

const curious: S = {
  name: "curious",
  onEnter(ctx) {
    if (ctx.pointer.inside && ctx.rng.chance(0.6)) {
      ctx.setTarget(ctx.pointer.pos.x, ctx.pointer.pos.y);
    } else {
      ctx.setTarget(
        ctx.rng.range(0.15, 0.85) * ctx.view.width,
        ctx.rng.range(0.15, 0.85) * ctx.view.height,
      );
    }
  },
  update(ctx) {
    if (ctx.pointer.inside && ctx.rng.chance(0.02)) {
      ctx.setTarget(ctx.pointer.pos.x, ctx.pointer.pos.y);
    }
    arrive(ctx.body, ctx.target.x, ctx.target.y, 70, 0.9);
    wanderForce(ctx, 0.4, 14);
    edges(ctx);
    ctx.nudgeMood(0.15, 0.03);
    if (dist(ctx.body.position, ctx.target) < 14 && ctx.rng.chance(0.03)) return "idle";
  },
  onEvent: reactCommon,
};

const distracted: S = {
  name: "distracted",
  onEnter(ctx) {
    ctx.expr.spin = 0;
  },
  update(ctx) {
    wanderForce(ctx, 0.9, 70); // dérive ample, ignore toute cible
    edges(ctx);
    ctx.expr.spin += ctx.noise.noise1(ctx.t * 0.8 + ctx.wanderSeed) * 0.03;
    ctx.nudgeMood(0.05, -0.01);
    if (ctx.timeInState > ctx.rng.range(2.5, 5)) return "idle";
  },
  onEvent: reactCommon,
};

const working: S = {
  name: "working",
  onEnter(ctx) {
    ctx.expr.squash = 0;
  },
  update(ctx) {
    // balayage en serpentin : va-et-vient horizontal + descente lente
    const w = ctx.view.width;
    const h = ctx.view.height;
    const sweep = (Math.sin(ctx.t * 1.8 + ctx.wanderSeed) * 0.5 + 0.5) * (w - 80) + 40;
    const lane = ((ctx.t * 18) % (h - 80)) + 40;
    arrive(ctx.body, sweep, lane, 40, 1);
    wanderForce(ctx, 0.5, 8);
    edges(ctx);
    ctx.expr.squash = Math.sin(ctx.t * 9) * 0.12; // « frottement »
    ctx.nudgeMood(-0.05, 0.06);
    if (ctx.timeInState > ctx.rng.range(4, 8)) return "idle";
  },
  onEvent: reactCommon,
};

// --- réactifs ------------------------------------------------------------

const success: S = {
  name: "success",
  onEnter(ctx) {
    ctx.body.applyImpulse(0, -260); // petit saut
    ctx.expr.squash = 0.9;
    ctx.expr.sparkle = true;
    ctx.nudgeMood(0.5, 0.9);
  },
  update(ctx) {
    seek(ctx.body, ...center(ctx), 0.05);
    edges(ctx);
    ctx.expr.squash *= 0.9;
    if (ctx.timeInState > 1.2) return "idle";
  },
};

const errorState: S = {
  name: "error",
  onEnter(ctx) {
    const dx = ctx.body.position.x - ctx.lastErrorAt.x;
    const dy = ctx.body.position.y - ctx.lastErrorAt.y;
    const d = Math.hypot(dx, dy) || 1;
    ctx.body.applyImpulse((dx / d) * 220, (dy / d) * 220 - 60); // recul
    ctx.expr.shake = 1;
    ctx.expr.puff = true;
    ctx.nudgeMood(0.8, -0.9);
  },
  update(ctx) {
    wanderForce(ctx, 3, 30); // frisson
    edges(ctx);
    ctx.expr.shake *= 0.88;
    if (ctx.timeInState > 1.5) return ctx.rng.chance(0.5) ? "curious" : "idle";
  },
};

const poked: S = {
  name: "poked",
  onEnter(ctx) {
    const dx = ctx.body.position.x - ctx.pointer.pos.x;
    const dy = ctx.body.position.y - ctx.pointer.pos.y;
    const d = Math.hypot(dx, dy) || 1;
    ctx.body.applyImpulse((dx / d) * 300, (dy / d) * 300); // fuit le doigt
    ctx.expr.spin += ctx.rng.sign() * 6;
    ctx.expr.squash = -0.5;
    ctx.nudgeMood(0.9, -0.15);
  },
  update(ctx) {
    edges(ctx);
    ctx.expr.squash *= 0.85;
    if (ctx.timeInState > 0.6) return "curious";
  },
};

export const STATES: S[] = [idle, curious, distracted, working, success, errorState, poked];
