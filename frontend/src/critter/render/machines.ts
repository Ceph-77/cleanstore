/**
 * Skins « devient la machine » + « conduit la machine » — autorécureuse,
 * polisseuse à propane, vadrouille à plat microfibre.
 *
 * Les tracés reprennent EXACTEMENT ceux de la maquette déjà validée par
 * Céphas (`design/console-shell/Simulations.dc.html`), portés en Path2D pour
 * le canvas au lieu du SVG statique. Le geste "working" (roues/disque qui
 * tournent, vadrouille qui balaie) et la pose "error" (raclette relevée /
 * polisseuse arrêtée qui brûle / vadrouille soulevée) viennent directement
 * des ÉTATS DÉJÀ EXISTANTS de la FSM (`behavior/states.ts`) — aucun
 * changement de comportement, seulement une nouvelle façon de le dessiner.
 *
 * Chaque machine est une FABRIQUE (`createXxxSkin`) plutôt qu'une fonction
 * directe : elle referme sur un petit état d'ANIMATION propre à l'instance
 * (angle de raclette, vitesse de rotation du disque, direction affichée) et
 * le fait DÉRIVER en douceur vers sa cible à chaque frame au lieu de sauter
 * dessus — sans ça les changements de pose "pop" instantanément (relevé
 * d'un coup, disque qui s'arrête net), lu comme robotique plutôt que
 * mécanique. Chaque skin calcule son propre dt en comparant `frame.elapsed`
 * d'un appel à l'autre (SkinInput n'expose pas dt directement).
 */
import type { Mood, StateName, Vec2 } from "../core/types";
import type { Skin, SkinInput } from "./skins";
import { mixHex } from "./draw";

// ─────────────────────────────────────────────────────────────────────────
// Pièces statiques : chaque machine est une liste de tracés SVG (repris tels
// quels de la maquette) construits une seule fois en Path2D.
// ─────────────────────────────────────────────────────────────────────────

interface PartDef {
  d: string;
  fill?: string;
  stroke?: string;
  lineWidth?: number;
  opacity?: number;
}
interface Part extends PartDef {
  path: Path2D;
}

function buildParts(defs: PartDef[]): Part[] {
  return defs.map((d) => ({ ...d, path: new Path2D(d.d) }));
}

function drawParts(g: CanvasRenderingContext2D, parts: Part[]): void {
  for (const p of parts) {
    g.save();
    if (p.opacity != null) g.globalAlpha = p.opacity;
    if (p.fill) {
      g.fillStyle = p.fill;
      g.fill(p.path);
    }
    if (p.stroke) {
      g.strokeStyle = p.stroke;
      g.lineWidth = p.lineWidth ?? 2;
      g.lineCap = "round";
      g.lineJoin = "round";
      g.stroke(p.path);
    }
    g.restore();
  }
}

/** Anneau en pointillés qui défile (dash-chase) — lisible comme une rotation, contrairement à une ellipse qu'on ferait tourner (effet toupie). */
function drawRim(
  g: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: string,
  lineWidth: number,
  dash: [number, number],
  offset: number,
): void {
  g.save();
  g.strokeStyle = color;
  g.lineWidth = lineWidth;
  g.setLineDash(dash);
  g.lineDashOffset = offset;
  g.beginPath();
  g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  g.stroke();
  g.restore();
}

const ledColor = (state: StateName): string => {
  if (state === "error") return "#c0453b";
  if (state === "success") return "#5bbd7a";
  if (state === "working") return "#5bbd7a";
  return "#e3a94c";
};

/**
 * Dérive `current` vers `target` en `halfLife` secondes (temps pour combler
 * la moitié de l'écart) — indépendant du framerate, contrairement à un
 * simple `+= (target-current)*0.1` par frame.
 */
function approach(current: number, target: number, dt: number, halfLife: number): number {
  if (dt <= 0) return current;
  const k = 1 - Math.pow(0.5, dt / halfLife);
  return current + (target - current) * k;
}

/** dt calculé en comparant l'horodatage d'un appel de skin à l'autre. */
function makeClock(): (elapsed: number) => number {
  let last = -1;
  return (elapsed: number) => {
    const dt = last < 0 ? 0 : Math.min(0.1, Math.max(0, elapsed - last));
    last = elapsed;
    return dt;
  };
}

/** Ne change de sens affiché que si la vitesse dépasse un seuil (évite le clignotement à l'arrêt). */
function makeFacing(): (vx: number) => 1 | -1 {
  let facing: 1 | -1 = 1; // 1 = orientation par défaut (gauche), -1 = miroir (droite)
  return (vx: number) => {
    if (vx > 8) facing = -1;
    else if (vx < -8) facing = 1;
    return facing;
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Opérateur — petit personnage qui pousse la machine (skins "…Driven").
// Même langage visuel que le blob (rond, expressif) plutôt qu'une silhouette
// humaine détaillée : c'est le mascotte qui manœuvre l'engin, pas un dessin
// réaliste de travailleur.
// ─────────────────────────────────────────────────────────────────────────

function drawOperator(
  g: CanvasRenderingContext2D,
  handX: number,
  handY: number,
  mood: Mood,
  state: StateName,
  t: number,
): void {
  const bodyX = handX + 26;
  const bodyY = handY + 34;
  const walk = state === "working" ? Math.sin(t * 7) : Math.sin(t * 2) * 0.3;
  const tint = mood.valence >= 0 ? mixHex("#4488ab", "#5bbd7a", mood.valence) : mixHex("#4488ab", "#c0453b", -mood.valence);

  g.save();
  g.translate(bodyX, bodyY);

  g.strokeStyle = "#2c3a42";
  g.lineWidth = 4;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(-4, 14);
  g.lineTo(-4 - walk * 5, 30);
  g.moveTo(4, 14);
  g.lineTo(4 + walk * 5, 30);
  g.stroke();

  g.strokeStyle = tint;
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(6, -4);
  g.lineTo(handX - bodyX, handY - bodyY);
  g.stroke();

  g.fillStyle = tint;
  g.beginPath();
  g.ellipse(0, 2, 11, 15, 0, 0, Math.PI * 2);
  g.fill();

  g.beginPath();
  g.arc(0, -20, 10, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#fdfcf9";
  g.beginPath();
  g.ellipse(-3.5, -21, 2.6, 3.2, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#262420";
  g.beginPath();
  g.arc(-3.5, -21, 1.3, 0, Math.PI * 2);
  g.fill();
  if (state === "error" || mood.valence < -0.2) {
    g.strokeStyle = "#262420";
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(-8, -27);
    g.lineTo(-2, -25);
    g.stroke();
  }

  g.restore();
}

// ─────────────────────────────────────────────────────────────────────────
// Assemblage commun : oriente/positionne/échelle, dessine l'ombre.
// ─────────────────────────────────────────────────────────────────────────

const SCALE = 0.42;

function withMachineTransform(
  g: CanvasRenderingContext2D,
  pos: Vec2,
  facing: 1 | -1,
  draw: () => void,
): void {
  g.save();
  g.translate(pos.x, pos.y);
  g.save();
  g.translate(0, 34 * SCALE);
  g.scale(1, 0.25);
  g.fillStyle = "rgba(20,20,15,0.18)";
  g.beginPath();
  g.arc(0, 0, 46 * SCALE, 0, Math.PI * 2);
  g.fill();
  g.restore();
  g.scale(facing * SCALE, SCALE);
  // les tracés sont en espace SVG 200×150, origine visuelle vers (90, 90)
  g.translate(-90, -90);
  draw();
  g.restore();
}

// ═══════════════════════════════════════════════════════ AUTORÉCUREUSE ═══

const scrubberParts = buildParts([
  { d: "M126 116 C 152 110 158 72 138 52", stroke: "#6b6459", lineWidth: 5 },
  { d: "M52 118 L52 60 Q52 40 72 40 L120 40 Q140 40 140 60 L140 118 Z", fill: "#e0b64a" },
  { d: "M60 52 h54 v40 h-54 Z", fill: "#eccd78", opacity: 0.7 },
  { d: "M52 118 H140", stroke: "#8a8578", lineWidth: 4 },
  { d: "M50 66 h5 v40 h-5 Z", fill: "rgba(255,255,255,0.55)" },
  { d: "M50 86 h5 v20 h-5 Z", fill: "#7fb2c6" },
  { d: "M86 32 h16 v10 h-16 Z", fill: "#3d3a30" },
  { d: "M138 52 Q168 44 180 24", stroke: "#5c5648", lineWidth: 5 },
  { d: "M156 17 h26 v15 h-26 Z", fill: "#262420" },
  { d: "M14 106 h66 v18 h-66 Z", fill: "#8a8578" },
  { d: "M12 124 H82 L78 132 H16 Z", fill: "#a8a396", opacity: 0.55 },
  {
    d: "M20 124 V131 M28 124 V131 M36 124 V131 M44 124 V131 M52 124 V131 M60 124 V131 M68 124 V131",
    stroke: "#8a8578",
    lineWidth: 2,
  },
]);
const scrubberWheel = new Path2D();
scrubberWheel.arc(20, 128, 6, 0, Math.PI * 2);
const scrubberSqueegeeArm = new Path2D("M96 118 L128 112");
const scrubberSqueegeeBlade = new Path2D("M84 126 Q112 135 132 121");

function drawScrubber(
  g: CanvasRenderingContext2D,
  s: SkinInput,
  squeegeeAngle: number,
  spinOffset: number,
  spinSpeed: number,
): void {
  const isError = s.state === "error";
  const t = s.frame.elapsed;

  drawParts(g, scrubberParts);
  g.fillStyle = "#262420";
  g.fill(scrubberWheel);
  g.fillStyle = ledColor(s.state);
  g.beginPath();
  g.arc(126, 56, 3.5, 0, Math.PI * 2);
  g.fill();

  g.fillStyle = "#d8cfb6";
  g.beginPath();
  g.ellipse(44, 126, 30, 7, 0, 0, Math.PI * 2);
  g.fill();
  drawRim(g, 44, 126, 30, 7, "#b3a988", 4, [4, 6], spinOffset);

  g.save();
  g.translate(128, 112);
  g.rotate(squeegeeAngle);
  g.translate(-128, -112);
  g.strokeStyle = "#3d3a30";
  g.lineWidth = 5;
  g.lineCap = "round";
  g.stroke(scrubberSqueegeeArm);
  g.strokeStyle = "#262420";
  g.lineWidth = 6;
  g.stroke(scrubberSqueegeeBlade);
  g.restore();

  if (spinSpeed > 0.15 && !isError) {
    g.fillStyle = "#7fb2c6";
    for (let i = 0; i < 2; i++) {
      const phase = (t * 1.1 + i * 0.4) % 1;
      g.globalAlpha = (phase < 0.4 ? phase / 0.4 : 1 - (phase - 0.4) / 0.6) * spinSpeed;
      g.beginPath();
      g.arc(70 + i * 9, 128 + phase * 10, 2.2, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  }

  const wetness = Math.max(0, -squeegeeAngle / ((40 * Math.PI) / 180));
  if (wetness > 0.05) {
    g.save();
    g.globalAlpha = 0.35 * wetness;
    g.fillStyle = "#466e78";
    g.beginPath();
    g.ellipse(50, 133, 42, 5, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
}

function createScrubberMachineSkin(driven: boolean): Skin {
  const clock = makeClock();
  const facing = makeFacing();
  let squeegeeAngle = 0;
  let spinSpeed = 0;
  let spinOffset = 0;

  return (g, s) => {
    const dt = clock(s.frame.elapsed);
    const isWorking = s.state === "working";
    const isError = s.state === "error";

    squeegeeAngle = approach(squeegeeAngle, isError ? (-40 * Math.PI) / 180 : 0, dt, 0.22);
    spinSpeed = approach(spinSpeed, isWorking ? 1 : 0, dt, 0.35);
    spinOffset -= spinSpeed * dt * 90;

    withMachineTransform(g, s.pos, facing(s.velocity.x), () => {
      drawScrubber(g, s, squeegeeAngle, spinOffset, spinSpeed);
      if (driven) drawOperator(g, 180, 24, s.mood, s.state, s.frame.elapsed);
    });
  };
}

export const createScrubberSkin = (): Skin => createScrubberMachineSkin(false);
export const createScrubberDrivenSkin = (): Skin => createScrubberMachineSkin(true);

// ═══════════════════════════════════════════════════════════ POLISSEUSE ═══

const polisherParts = buildParts([
  { d: "M138 66 Q176 56 184 22", stroke: "#5c5648", lineWidth: 6 },
  { d: "M178 26 L192 20", stroke: "#3d3a30", lineWidth: 5 },
  { d: "M40 118 L40 84 Q40 74 52 74 L128 74 Q140 74 140 86 L140 118 Z", fill: "#d7912f" },
  { d: "M36 118 H140", stroke: "#8a5a20", lineWidth: 4 },
  { d: "M86 56 h40 v22 h-40 Z", fill: "#3d3a30" },
  { d: "M96 60 H120 M96 65 H120 M96 70 H120", stroke: "#5c5648", lineWidth: 1.5 },
  { d: "M104 40 h72 v26 h-72 Z", fill: "#cdbb99" },
  { d: "M120 39 h4 v28 h-4 Z", fill: "#3d3a30", opacity: 0.55 },
  { d: "M152 39 h4 v28 h-4 Z", fill: "#3d3a30", opacity: 0.55 },
  { d: "M167 33 h11 v9 h-11 Z", fill: "#262420" },
  { d: "M168 42 Q150 52 126 60", stroke: "#3d3a30", lineWidth: 3 },
  { d: "M12 112 h86 v14 h-86 Z", fill: "#e0b64a" },
  { d: "M10 126 H100 L96 133 H14 Z", fill: "#cbb98f", opacity: 0.6 },
]);
const polisherGauge = new Path2D();
polisherGauge.arc(90, 52, 7, 0, Math.PI * 2);
const polisherValveKnob = new Path2D();
polisherValveKnob.arc(172, 32, 3, 0, Math.PI * 2);
const polisherTankCapL = new Path2D();
polisherTankCapL.ellipse(106, 53, 4, 13, 0, 0, Math.PI * 2);
const polisherTankCapR = new Path2D();
polisherTankCapR.ellipse(174, 53, 4, 13, 0, 0, Math.PI * 2);
const polisherWheel = new Path2D();
polisherWheel.arc(128, 116, 22, 0, Math.PI * 2);
const polisherWheelHub = new Path2D();
polisherWheelHub.arc(128, 116, 9, 0, Math.PI * 2);
const polisherSmallWheel = new Path2D();
polisherSmallWheel.arc(18, 128, 6, 0, Math.PI * 2);
const polisherFlame = new Path2D("M124 74 q-3 -6 0 -11 q3 5 0 11 Z");

function drawPolisher(
  g: CanvasRenderingContext2D,
  s: SkinInput,
  spinOffset: number,
  spinSpeed: number,
  burnIntensity: number,
): void {
  const t = s.frame.elapsed;

  drawParts(g, polisherParts);
  g.fillStyle = "#262420";
  g.fill(polisherGauge);
  g.fillStyle = "#5c5648";
  g.fill(polisherValveKnob);
  g.fillStyle = "#b3a179";
  g.fill(polisherTankCapL);
  g.fill(polisherTankCapR);
  g.fillStyle = "#253e50";
  g.fill(polisherWheel);
  g.fillStyle = "#5c5648";
  g.fill(polisherWheelHub);
  g.strokeStyle = "#1a2b38";
  g.lineWidth = 3;
  g.stroke(polisherWheel);
  g.fillStyle = "#3d3a30";
  g.fill(polisherSmallWheel);
  g.fillStyle = ledColor(s.state);
  g.beginPath();
  g.arc(60, 82, 3.5, 0, Math.PI * 2);
  g.fill();

  // flamme (toujours allumée — propane), papillote en continu
  g.save();
  const flick = 1 + Math.sin(t * 22) * 0.22;
  g.translate(124, 74);
  g.scale(1, flick);
  g.translate(-124, -74);
  g.fillStyle = "#e3a94c";
  g.fill(polisherFlame);
  g.restore();

  // échappement — son intensité suit la vitesse du disque, pas un tout-ou-rien
  if (spinSpeed > 0.1) {
    g.fillStyle = "rgba(120,110,100,0.45)";
    for (let i = 0; i < 2; i++) {
      const phase = (t * 0.9 + i * 0.5) % 1;
      g.globalAlpha = 0.5 * (1 - phase) * spinSpeed;
      g.beginPath();
      g.arc(128 + i * 3, 55 - phase * 16, 3.5 - phase * 1.5, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  }

  g.save();
  g.fillStyle = "rgba(201,80,59,0.22)";
  g.beginPath();
  g.ellipse(52, 128, 40, 8, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#d98a6a";
  g.beginPath();
  g.ellipse(52, 128, 38, 7, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
  drawRim(g, 52, 128, 38, 7, "#f0d4c4", 3, [18, 30], spinOffset);

  // laissée en place, disque qui tourne encore : brûlure + fumée qui montent en intensité
  if (burnIntensity > 0.03) {
    g.save();
    g.globalAlpha = 0.6 * burnIntensity;
    const grad = g.createRadialGradient(52, 122, 1, 52, 122, 22);
    grad.addColorStop(0, "rgba(60,40,28,0.85)");
    grad.addColorStop(1, "rgba(60,40,28,0)");
    g.fillStyle = grad;
    g.beginPath();
    g.ellipse(52, 122, 22 * burnIntensity, 7 * burnIntensity, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
    g.save();
    g.fillStyle = "rgba(120,110,100,0.5)";
    const rise = (t * 0.5) % 1;
    g.globalAlpha = 0.5 * (1 - rise) * burnIntensity;
    g.beginPath();
    g.arc(52, 118 - rise * 30, 5 + rise * 4, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
}

function createPolisherMachineSkin(driven: boolean): Skin {
  const clock = makeClock();
  const facing = makeFacing();
  let spinSpeed = 0;
  let spinOffset = 0;
  let burnIntensity = 0;

  return (g, s) => {
    const dt = clock(s.frame.elapsed);
    const isWorking = s.state === "working";
    const isError = s.state === "error";

    spinSpeed = approach(spinSpeed, isWorking || isError ? 1 : 0, dt, 0.3);
    spinOffset -= spinSpeed * dt * 260;
    burnIntensity = approach(burnIntensity, isError ? 1 : 0, dt, 0.4);

    withMachineTransform(g, s.pos, facing(s.velocity.x), () => {
      drawPolisher(g, s, spinOffset, spinSpeed, burnIntensity);
      if (driven) drawOperator(g, 190, 20, s.mood, s.state, s.frame.elapsed);
    });
  };
}

export const createPolisherSkin = (): Skin => createPolisherMachineSkin(false);
export const createPolisherDrivenSkin = (): Skin => createPolisherMachineSkin(true);

// ═════════════════════════════════════════════════════════ VADROUILLE ═══

const broomHandle = buildParts([
  { d: "M186 14 L96 96", stroke: "#c9d0d4", lineWidth: 5 },
  { d: "M185 15 l7 -6", stroke: "#6b6459", lineWidth: 8 },
]);
const broomJoints = buildParts([
  { d: "M149 43 h10 v13 h-10 Z", fill: "#6b6459" },
  { d: "M121 69 h10 v13 h-10 Z", fill: "#6b6459" },
]);
const broomSwivel = buildParts([{ d: "M92 92 L104 100 M100 96 L96 106", stroke: "#7c7671", lineWidth: 5 }]);
const broomSwivelKnob = new Path2D();
broomSwivelKnob.arc(98, 104, 4, 0, Math.PI * 2);

const broomFrame = buildParts([
  { d: "M28 121 Q34 115 44 117 L132 117 Q142 115 148 121 Q150 130 142 133 L34 133 Q26 130 28 121 Z", fill: "#aab0b6" },
  { d: "M40 112 h96 v9 h-96 Z", fill: "#7c7671" },
  { d: "M58 118 h12 v14 h-12 Z", fill: "#eef0ee", opacity: 0.85 },
  { d: "M106 118 h12 v14 h-12 Z", fill: "#eef0ee", opacity: 0.85 },
  {
    d:
      "M26 124 q-4 2 -3 7 M31 131 q-3 3 -1 6 M42 134 q-1 4 2 5 " +
      "M64 135 q0 4 3 5 M92 135 q0 4 3 5 M120 134 q1 4 4 4 " +
      "M143 131 q4 2 4 6 M148 123 q5 1 5 7",
    stroke: "#9aa0a6",
    lineWidth: 2.5,
  },
]);
const broomPedal = new Path2D();
broomPedal.ellipse(92, 112, 11, 4, 0, 0, Math.PI * 2);

function drawBroom(g: CanvasRenderingContext2D, s: SkinInput, lift: number): void {
  const t = s.frame.elapsed;

  g.save();
  // soulèvement en fin de passe : monte/pivote proportionnellement, pas d'un coup
  g.translate(96, 96);
  g.rotate((-13 * Math.PI) / 180 * lift);
  g.translate(0, -12 * lift);
  g.translate(-96, -96);

  drawParts(g, broomHandle);
  drawParts(g, broomJoints);
  drawParts(g, broomSwivel);
  g.fillStyle = "#7c7671";
  g.fill(broomSwivelKnob);

  // balayage : léger roulis continu, atténué à mesure qu'elle se soulève
  g.save();
  g.translate(88, 125);
  g.rotate(Math.sin(t * 2.4) * ((3.2 * Math.PI) / 180) * (1 - lift));
  g.translate(-88, -125);
  drawParts(g, broomFrame);
  g.fillStyle = "#e5842f";
  g.fill(broomPedal);
  g.restore();

  g.restore();

  // poussière qui retombe — proportionnelle au soulèvement
  if (lift > 0.15) {
    g.save();
    for (let i = 0; i < 4; i++) {
      const phase = (t * 0.6 + i * 0.22) % 1;
      g.globalAlpha = (phase < 0.7 ? 0.7 : 0.7 * (1 - (phase - 0.7) / 0.3)) * lift;
      g.fillStyle = "#6f6350";
      g.beginPath();
      g.arc(70 + i * 8 - phase * 6, 118 - Math.sin(phase * Math.PI) * 14, 2.4, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }
}

function createBroomMachineSkin(driven: boolean): Skin {
  const clock = makeClock();
  const facing = makeFacing();
  let lift = 0;

  return (g, s) => {
    const dt = clock(s.frame.elapsed);
    const isError = s.state === "error";
    lift = approach(lift, isError ? 1 : 0, dt, 0.2);

    withMachineTransform(g, s.pos, facing(s.velocity.x), () => {
      drawBroom(g, s, lift);
      if (driven) drawOperator(g, 186, 14, s.mood, s.state, s.frame.elapsed);
    });
  };
}

export const createBroomSkin = (): Skin => createBroomMachineSkin(false);
export const createBroomDrivenSkin = (): Skin => createBroomMachineSkin(true);
