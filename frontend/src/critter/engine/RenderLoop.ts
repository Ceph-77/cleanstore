/**
 * Boucle de rendu principale.
 *
 * Sépare strictement la SIMULATION du RENDU :
 *  - `update(dt)` est appelé à pas de temps FIXE (défaut 1/60 s). La physique et
 *    la FSM sont donc déterministes et indépendantes du framerate.
 *  - `render(alpha)` est appelé une fois par frame écran, avec `alpha` ∈ [0, 1)
 *    = fraction de pas restant à interpoler pour un rendu sans saccade.
 *
 * Protections incluses :
 *  - clamp du delta après un onglet en arrière-plan (évite un rattrapage massif) ;
 *  - garde anti « spirale de la mort » (max N sous-pas par frame) ;
 *  - pause automatique quand la page est cachée (économie CPU / batterie).
 */

export interface LoopCallbacks {
  /** Avance la simulation d'un pas fixe. `dt` en secondes. */
  update(dt: number, elapsed: number): void;
  /** Dessine l'état courant. `alpha` interpole vers le prochain pas. */
  render(alpha: number, elapsed: number): void;
}

export interface RenderLoopOptions {
  /** Durée d'un pas de simulation, en secondes. Défaut 1/60. */
  fixedStep?: number;
  /** Delta max pris en compte pour une frame, en secondes. Défaut 0.25. */
  maxFrameDelta?: number;
  /** Nombre max de sous-pas `update` par frame. Défaut 5. */
  maxSubSteps?: number;
  /** Met la boucle en pause quand `document.hidden`. Défaut true. */
  autoPauseOnHidden?: boolean;
}

export class RenderLoop {
  private readonly cb: LoopCallbacks;
  private readonly step: number;
  private readonly maxDelta: number;
  private readonly maxSubSteps: number;
  private readonly autoPause: boolean;

  private rafId = 0;
  private running = false;
  private lastTime = 0;
  private accumulator = 0;
  private elapsed = 0;

  constructor(cb: LoopCallbacks, opts: RenderLoopOptions = {}) {
    this.cb = cb;
    this.step = opts.fixedStep ?? 1 / 60;
    this.maxDelta = opts.maxFrameDelta ?? 0.25;
    this.maxSubSteps = opts.maxSubSteps ?? 5;
    this.autoPause = opts.autoPauseOnHidden ?? true;
  }

  get isRunning(): boolean {
    return this.running;
  }

  /** Secondes de simulation écoulées depuis le premier `start()`. */
  get time(): number {
    return this.elapsed;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    if (this.autoPause && typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this.onVisibility);
    }
    this.rafId = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    if (this.autoPause && typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.onVisibility);
    }
  }

  private readonly onVisibility = (): void => {
    if (document.hidden) {
      if (this.rafId) cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    } else if (this.running && !this.rafId) {
      // Reprend sans compter le temps passé caché.
      this.lastTime = performance.now();
      this.accumulator = 0;
      this.rafId = requestAnimationFrame(this.frame);
    }
  };

  private readonly frame = (now: number): void => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.frame);

    let delta = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (delta > this.maxDelta) delta = this.maxDelta;
    if (delta < 0) delta = 0;

    this.accumulator += delta;

    let sub = 0;
    while (this.accumulator >= this.step && sub < this.maxSubSteps) {
      this.cb.update(this.step, this.elapsed);
      this.elapsed += this.step;
      this.accumulator -= this.step;
      sub++;
    }
    // Si on a saturé les sous-pas, on jette le retard plutôt que d'accumuler.
    if (sub === this.maxSubSteps) this.accumulator = 0;

    const alpha = this.accumulator / this.step;
    this.cb.render(alpha, this.elapsed);
  };
}
