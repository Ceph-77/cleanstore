/**
 * « Cerveau » : la part de hasard *contrôlé*.
 *
 * Ne décide QUE des états ambiants (idle / curious / distracted / working) —
 * les états réactifs (success / error / poked) sont pilotés par les événements.
 *
 * Le choix est un tirage pondéré dont les poids dépendent de l'humeur :
 *  - arousal élevé  -> curiosité / distraction plus probables ;
 *  - arousal bas    -> repos / travail ;
 * plus un cooldown par état pour éviter le clignotement, et une durée minimale
 * passée dans l'état courant avant d'envisager un changement.
 */
import type { Mood, StateName } from "../core/types";
import type { Rng } from "../core/rng";
import { weightedPick } from "../core/rng";

type Ambient = Extract<StateName, "idle" | "curious" | "distracted" | "working">;
const AMBIENT: Ambient[] = ["idle", "curious", "distracted", "working"];

export interface BrainOptions {
  /** Temps minimum dans un état ambiant avant de reconsidérer (s). Défaut 1.4. */
  minDwell?: number;
  /** Fenêtre moyenne entre deux décisions (s). Défaut 2.6. */
  decisionEvery?: number;
  /** Cooldown après avoir quitté un état avant d'y revenir (s). Défaut 3. */
  cooldown?: number;
}

export class Brain {
  private readonly rng: Rng;
  private readonly minDwell: number;
  private readonly decisionEvery: number;
  private readonly cooldown: number;

  private nextDecisionIn: number;
  private readonly cooldowns: Record<Ambient, number> = {
    idle: 0,
    curious: 0,
    distracted: 0,
    working: 0,
  };

  constructor(rng: Rng, opts: BrainOptions = {}) {
    this.rng = rng;
    this.minDwell = opts.minDwell ?? 1.4;
    this.decisionEvery = opts.decisionEvery ?? 2.6;
    this.cooldown = opts.cooldown ?? 3;
    this.nextDecisionIn = this.rng.range(0.5, this.decisionEvery);
  }

  /** À appeler chaque pas. Renvoie un état ambiant à adopter, ou `null`. */
  tick(dt: number, current: StateName, timeInState: number, mood: Mood): Ambient | null {
    for (const k of AMBIENT) this.cooldowns[k] = Math.max(0, this.cooldowns[k] - dt);
    this.nextDecisionIn -= dt;

    // On ne débraye pas un état réactif : le Brain n'agit que sur l'ambiant.
    if (!AMBIENT.includes(current as Ambient)) return null;
    if (this.nextDecisionIn > 0 || timeInState < this.minDwell) return null;

    this.nextDecisionIn = this.rng.range(this.decisionEvery * 0.5, this.decisionEvery * 1.5);

    const a = clamp01(mood.arousal);
    const weights: Partial<Record<Ambient, number>> = {
      idle: 0.6 + (1 - a) * 1.8,
      working: 0.4 + (1 - a) * 1.2 + Math.max(0, mood.valence) * 0.6,
      curious: 0.5 + a * 2.2,
      distracted: 0.2 + a * 1.6,
    };
    // Ne pas re-choisir l'état courant, respecter les cooldowns.
    weights[current as Ambient] = 0;
    for (const k of AMBIENT) if (this.cooldowns[k] > 0) weights[k] = 0;

    const pick = weightedPick(this.rng, weights);
    if (!pick || pick === current) return null;

    this.cooldowns[current as Ambient] = this.cooldown;
    return pick;
  }

  /** Réinitialise le minuteur de décision (ex. après un état réactif). */
  defer(seconds = 1): void {
    this.nextDecisionIn = Math.max(this.nextDecisionIn, seconds);
  }
}

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);
