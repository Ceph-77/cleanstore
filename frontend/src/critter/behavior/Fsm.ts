/**
 * Machine à états finis générique.
 *
 * Chaque état déclare des hooks optionnels :
 *  - `onEnter(ctx, from)` : init (choisir une cible, régler l'humeur…)
 *  - `update(ctx, dt) -> StateName | void` : logique par pas ; renvoyer un nom
 *    d'état déclenche une transition ; `void` reste dans l'état.
 *  - `onExit(ctx, to)` : nettoyage.
 *  - `onEvent(ctx, event) -> StateName | void` : réaction à un stimulus.
 *
 * La FSM ne connaît PAS le critter : elle est paramétrée par un contexte `C`.
 * Cela garde la logique comportementale isolée du rendu et de la physique.
 */

export interface FsmState<C, S extends string, E = unknown> {
  name: S;
  onEnter?(ctx: C, from: S | null): void;
  onExit?(ctx: C, to: S): void;
  update?(ctx: C, dt: number): S | void;
  onEvent?(ctx: C, event: E): S | void;
}

export interface FsmOptions<S extends string> {
  initial: S;
  /** Appelé à chaque transition effective (debug / analytics). */
  onTransition?(from: S, to: S): void;
}

export class Fsm<C, S extends string, E = unknown> {
  private readonly states: Map<S, FsmState<C, S, E>>;
  private readonly ctx: C;
  private readonly onTransition?: (from: S, to: S) => void;

  private current: FsmState<C, S, E>;
  /** Secondes écoulées dans l'état courant. */
  timeInState = 0;
  /** Nombre de transitions depuis la création (utile pour du throttling). */
  transitions = 0;

  constructor(ctx: C, states: FsmState<C, S, E>[], opts: FsmOptions<S>) {
    this.ctx = ctx;
    this.states = new Map(states.map((s) => [s.name, s]));
    this.onTransition = opts.onTransition;
    const initial = this.states.get(opts.initial);
    if (!initial) throw new Error(`Fsm: état initial inconnu "${opts.initial}"`);
    this.current = initial;
    this.current.onEnter?.(this.ctx, null);
  }

  get state(): S {
    return this.current.name;
  }

  is(name: S): boolean {
    return this.current.name === name;
  }

  /** Force une transition (ignore si déjà dans l'état ou si l'état est inconnu). */
  transitionTo(name: S): void {
    if (name === this.current.name) return;
    const next = this.states.get(name);
    if (!next) {
      console.warn(`Fsm: transition vers un état inconnu "${name}"`);
      return;
    }
    const from = this.current.name;
    this.current.onExit?.(this.ctx, name);
    this.current = next;
    this.timeInState = 0;
    this.transitions++;
    this.current.onEnter?.(this.ctx, from);
    this.onTransition?.(from, name);
  }

  /** Avance l'état courant d'un pas fixe. */
  update(dt: number): void {
    this.timeInState += dt;
    const next = this.current.update?.(this.ctx, dt);
    if (next) this.transitionTo(next);
  }

  /** Transmet un stimulus à l'état courant. */
  send(event: E): void {
    const next = this.current.onEvent?.(this.ctx, event);
    if (next) this.transitionTo(next);
  }
}
