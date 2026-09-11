/**
 * Contexte partagé passé à la FSM et à chaque état.
 *
 * C'est la seule surface par laquelle la logique comportementale touche le
 * monde : elle lit/écrit ici, jamais directement le renderer ni le DOM.
 */
import type { AppEventType, Mood, Vec2, View } from "../core/types";
import type { Rng } from "../core/rng";
import type { Noise } from "../core/noise";
import type { Body } from "../engine/Physics";

export interface Pointer {
  /** Position du pointeur en espace View (px). */
  pos: Vec2;
  /** Le pointeur est-il au-dessus du canvas ? */
  inside: boolean;
  /** Bouton / doigt enfoncé ? */
  down: boolean;
}

/** Drapeaux visuels transitoires lus par le skin (remis à zéro après lecture). */
export interface Expression {
  /** Écrasement vertical : -1 aplati, 0 neutre, +1 étiré. */
  squash: number;
  /** Rotation du corps (rad), pour les toupies / secousses. */
  spin: number;
  /** 0..1 : intensité de tremblement haute fréquence. */
  shake: number;
  /** Impulsion « éclat » à jouer une fois (étoiles de succès). */
  sparkle: boolean;
  /** Impulsion « nuage » à jouer une fois (poussière d'erreur). */
  puff: boolean;
}

export interface CritterContext {
  readonly body: Body;
  readonly view: View;
  readonly rng: Rng;
  readonly noise: Noise;
  readonly mood: Mood;
  readonly pointer: Pointer;
  readonly expr: Expression;

  /** Temps simulé écoulé (s). Mis à jour par le Critter avant `fsm.update`. */
  t: number;
  /** Temps passé dans l'état courant (s). Recopié depuis la FSM chaque pas. */
  timeInState: number;
  /** Décalage propre à cet individu dans le champ de bruit (varie le style). */
  readonly wanderSeed: number;
  /** Cible de steering courante (les états écrivent dedans). */
  readonly target: Vec2;
  /** Dernier instant (s) où chaque type d'événement a été reçu. */
  readonly lastEventAt: Partial<Record<AppEventType, number>>;
  /** Dernier point d'erreur connu (pour le recul). */
  readonly lastErrorAt: Vec2;

  /** Pousse l'humeur puis laisse-la retomber vers le repos (borné). */
  nudgeMood(dArousal: number, dValence: number): void;
  /** Place la cible de steering. */
  setTarget(x: number, y: number): void;
}
