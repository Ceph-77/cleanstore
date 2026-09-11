/**
 * Types partagés par tout le module `critter`.
 * Aucune dépendance : ce fichier ne doit jamais importer autre chose que des types.
 */

/** Vecteur 2D mutable. On réutilise les instances dans la boucle pour éviter le GC. */
export interface Vec2 {
  x: number;
  y: number;
}

/**
 * Fenêtre de rendu logique. Le monde du critter vit dans cet espace (px CSS),
 * indépendamment du device-pixel-ratio réel du canvas.
 */
export interface View {
  width: number;
  height: number;
  /** device pixel ratio appliqué au backing store du canvas. */
  dpr: number;
}

/** Snapshot immuable passé au renderer à chaque frame. */
export interface RenderFrame {
  /** Facteur d'interpolation [0, 1) entre le dernier et le prochain pas fixe. */
  alpha: number;
  /** Temps simulé écoulé depuis le start, en secondes. */
  elapsed: number;
  view: View;
}

/** Événements applicatifs que le critter sait interpréter. */
export type AppEventType =
  | "success" // une tâche a réussi / un score d'inspection élevé
  | "error" // une erreur utilisateur / une action refusée
  | "wait" // attente prolongée sans interaction
  | "click" // l'utilisateur a cliqué / touché le critter
  | "hover" // le pointeur survole le critter
  | "focus" // la vue qui contient le critter est redevenue active
  | "blur"; // la vue est passée en arrière-plan

export interface AppEvent {
  type: AppEventType;
  /** Intensité relative de l'événement, [0, 1]. Défaut 1. */
  strength?: number;
  /** Position (espace View) associée, ex. le point cliqué. */
  at?: Vec2;
  /** Horodatage `performance.now()` du déclenchement. */
  t?: number;
}

/** Noms des états de la FSM comportementale. */
export type StateName =
  | "idle"
  | "curious"
  | "distracted"
  | "working"
  | "success"
  | "error"
  | "poked";

/** Humeur continue du critter, poussée par les stimuli et relâchée vers le repos. */
export interface Mood {
  /** Éveil / énergie : 0 = amorphe, 1 = agité. */
  arousal: number;
  /** Valence : -1 = contrarié, 0 = neutre, +1 = content. */
  valence: number;
}
