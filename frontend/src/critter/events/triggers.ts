/**
 * Déclencheurs d'événements : la couche qui traduit le monde extérieur (DOM,
 * cycle de vie, temps qui passe) en `AppEvent` pour le critter.
 *
 * Deux sources :
 *  - `attachDomTriggers` : pointeur + focus/blur de l'onglet, branchés sur un
 *    élément (le canvas). Gère aussi la détection d'« attente prolongée ».
 *  - un `EventBus` applicatif : la console `emit("success" | "error" | …)` et le
 *    critter y est abonné. Voir `EventBus`.
 */
import type { AppEvent, View } from "../core/types";

export interface CritterSink {
  sendEvent(e: AppEvent): void;
  setPointer(x: number, y: number, inside: boolean, down: boolean): void;
}

export interface DomTriggerOptions {
  /** Élément qui reçoit les écouteurs pointeur (typiquement le canvas). */
  element: HTMLElement;
  /** Fournit la taille logique courante (pour convertir les coords). */
  getView(): View;
  /** Secondes d'inactivité avant d'émettre `wait`. 0 = désactivé. Défaut 12. */
  idleAfter?: number;
  /** Émet `wait` à répétition tant que l'inactivité dure. Défaut true. */
  repeatWait?: boolean;
}

export function attachDomTriggers(sink: CritterSink, opts: DomTriggerOptions): () => void {
  const { element } = opts;
  const idleAfter = opts.idleAfter ?? 12;
  const repeat = opts.repeatWait ?? true;

  let lastActivity = performance.now();
  let waited = false;
  let idleTimer = 0;

  const toLocal = (e: PointerEvent | MouseEvent): { x: number; y: number } => {
    const rect = element.getBoundingClientRect();
    const view = opts.getView();
    return {
      x: ((e.clientX - rect.left) / rect.width) * view.width,
      y: ((e.clientY - rect.top) / rect.height) * view.height,
    };
  };

  const markActive = (): void => {
    lastActivity = performance.now();
    waited = false;
  };

  const onMove = (e: PointerEvent): void => {
    const p = toLocal(e);
    sink.setPointer(p.x, p.y, true, e.pressure > 0 || (e.buttons & 1) === 1);
    markActive();
  };
  const onEnter = (e: PointerEvent): void => {
    const p = toLocal(e);
    sink.setPointer(p.x, p.y, true, false);
    sink.sendEvent({ type: "hover", at: p, t: performance.now() });
  };
  const onLeave = (): void => sink.setPointer(0, 0, false, false);
  const onDown = (e: PointerEvent): void => {
    const p = toLocal(e);
    sink.setPointer(p.x, p.y, true, true);
    markActive();
  };
  const onClick = (e: MouseEvent): void => {
    const p = toLocal(e);
    sink.sendEvent({ type: "click", at: p, strength: 1, t: performance.now() });
    markActive();
  };
  const onVisibility = (): void => {
    sink.sendEvent({ type: document.hidden ? "blur" : "focus", t: performance.now() });
    if (!document.hidden) markActive();
  };

  const tickIdle = (): void => {
    if (idleAfter <= 0) return;
    const idleFor = (performance.now() - lastActivity) / 1000;
    if (idleFor >= idleAfter && (repeat || !waited)) {
      sink.sendEvent({ type: "wait", strength: 1, t: performance.now() });
      waited = true;
      // en mode répétition, ré-émet après ~60 % du délai
      if (repeat) lastActivity = performance.now() - idleAfter * 1000 * 0.4;
    }
  };

  element.addEventListener("pointermove", onMove);
  element.addEventListener("pointerenter", onEnter);
  element.addEventListener("pointerleave", onLeave);
  element.addEventListener("pointerdown", onDown);
  element.addEventListener("click", onClick);
  document.addEventListener("visibilitychange", onVisibility);
  idleTimer = window.setInterval(tickIdle, 1000);

  return () => {
    element.removeEventListener("pointermove", onMove);
    element.removeEventListener("pointerenter", onEnter);
    element.removeEventListener("pointerleave", onLeave);
    element.removeEventListener("pointerdown", onDown);
    element.removeEventListener("click", onClick);
    document.removeEventListener("visibilitychange", onVisibility);
    clearInterval(idleTimer);
  };
}
