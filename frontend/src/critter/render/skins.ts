/**
 * Skins : fonctions de rendu pures. Reçoivent un instantané interpolé et
 * dessinent — jamais l'inverse. On peut donc changer d'apparence sans toucher
 * au comportement.
 *
 * `blobSkin` est l'apparence par défaut (mascotte abstraite). Les skins
 * `scrubber` / `polisher` / `broom` (machines KLEAN'STOR) sont des stubs : même
 * silhouette pour l'instant, à étoffer.
 */
import type { Mood, RenderFrame, StateName, Vec2 } from "../core/types";
import type { Expression } from "../behavior/context";
import { blobPath, mixHex, starPath } from "./draw";

export interface SkinInput {
  frame: RenderFrame;
  /** Position interpolée (espace View). */
  pos: Vec2;
  velocity: Vec2;
  state: StateName;
  mood: Mood;
  expr: Expression;
}

export type Skin = (g: CanvasRenderingContext2D, s: SkinInput) => void;

const BASE = "#4488ab"; // flow-500
const HAPPY = "#5bbd7a";
const UPSET = "#c0453b";

export const blobSkin: Skin = (g, s) => {
  const { pos, velocity, mood, expr, frame } = s;
  const speed = Math.hypot(velocity.x, velocity.y);
  const heading = Math.atan2(velocity.y, velocity.x);

  // squash-stretch : s'étire dans le sens du mouvement + expression ponctuelle
  const stretch = Math.min(0.35, speed / 900) + Math.max(0, expr.squash) * 0.4;
  const squash = Math.max(0, -expr.squash) * 0.5;
  const rx = 22 * (1 + stretch - squash * 0.4);
  const ry = 22 * (1 - stretch * 0.6 + squash);

  // couleur selon la valence
  const tint =
    mood.valence >= 0 ? mixHex(BASE, HAPPY, mood.valence) : mixHex(BASE, UPSET, -mood.valence);

  // tremblement (état error)
  const jitterX = expr.shake ? (Math.random() - 0.5) * expr.shake * 8 : 0;
  const jitterY = expr.shake ? (Math.random() - 0.5) * expr.shake * 8 : 0;

  g.save();
  g.translate(pos.x + jitterX, pos.y + jitterY);

  // ombre portée
  g.save();
  g.translate(0, ry + 6);
  g.scale(1, 0.28);
  g.fillStyle = "rgba(38,36,32,0.16)";
  g.beginPath();
  g.arc(0, 0, rx * 0.9, 0, Math.PI * 2);
  g.fill();
  g.restore();

  g.rotate(expr.spin + (speed > 20 ? Math.sin(heading) * 0.15 : 0));

  // corps
  g.fillStyle = tint;
  blobPath(g, rx, ry);
  g.fill();
  g.fillStyle = "rgba(255,255,255,0.18)";
  blobPath(g, rx * 0.6, ry * 0.6);
  g.save();
  g.translate(-rx * 0.2, -ry * 0.25);
  g.scale(0.7, 0.7);
  blobPath(g, rx * 0.6, ry * 0.6);
  g.fill();
  g.restore();

  // yeux : regardent vers la vitesse (ou la cible implicite)
  const look = speed > 8 ? heading : Math.sin(frame.elapsed * 0.7) * 0.6;
  const ex = Math.cos(look) * 3;
  const ey = Math.sin(look) * 2;
  for (const sx of [-1, 1]) {
    g.fillStyle = "#fdfcf9";
    g.beginPath();
    g.ellipse(sx * 7, -2, 4.5, 5.5, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#262420";
    g.beginPath();
    g.arc(sx * 7 + ex, -2 + ey, 2.4, 0, Math.PI * 2);
    g.fill();
  }
  // sourcils selon l'humeur / l'état
  if (mood.valence < -0.2 || s.state === "error") {
    g.strokeStyle = "#262420";
    g.lineWidth = 1.8;
    g.beginPath();
    g.moveTo(-11, -9);
    g.lineTo(-3, -6);
    g.moveTo(11, -9);
    g.lineTo(3, -6);
    g.stroke();
  }

  g.restore();

  // éclats de succès
  if (expr.sparkle) {
    g.save();
    g.translate(pos.x, pos.y);
    g.fillStyle = "#e3a94c";
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + frame.elapsed;
      starPath(g, Math.cos(a) * 34, Math.sin(a) * 34, 5, 2, 4);
      g.fill();
    }
    g.restore();
  }
  // nuage d'erreur
  if (expr.puff) {
    g.save();
    g.translate(pos.x, pos.y + ry);
    g.fillStyle = "rgba(150,140,120,0.5)";
    for (let i = 0; i < 4; i++) {
      g.beginPath();
      g.arc((i - 1.5) * 9, 0, 6, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }
};

