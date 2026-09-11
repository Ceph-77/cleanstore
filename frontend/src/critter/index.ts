/**
 * `critter` — module d'animation procédurale réactive.
 *
 * Trois couches, importables séparément :
 *   1. LOGIQUE COMPORTEMENTALE  → behavior/  (Fsm, Brain, states, context)
 *   2. BOUCLE DE RENDU          → engine/    (RenderLoop, Physics, Critter)
 *   3. DÉCLENCHEURS D'ÉVÉNEMENTS → events/   (EventBus, triggers)
 *   +  rendu (render/) et binding React (react/).
 *
 * Usage minimal dans l'app :
 *   import { Critter } from "@/critter";
 *   <div style={{ width: 200, height: 140 }}><Critter /></div>
 *
 * Usage moteur seul (tests, autre framework) :
 *   import { Critter as Engine, RenderLoop } from "@/critter";
 */

// --- core
export { makeRng, weightedPick, type Rng } from "./core/rng";
export { makeNoise, type Noise } from "./core/noise";
export * as vec2 from "./core/vec2";
export type {
  Vec2,
  View,
  Mood,
  RenderFrame,
  AppEvent,
  AppEventType,
  StateName,
} from "./core/types";

// --- engine (boucle de rendu + physique + entité)
export { RenderLoop, type LoopCallbacks, type RenderLoopOptions } from "./engine/RenderLoop";
export { Body, seek, arrive, containWithin } from "./engine/Physics";
export { Critter as CritterEngine, type CritterOptions } from "./engine/Critter";

// --- behavior (FSM)
export { Fsm, type FsmState, type FsmOptions } from "./behavior/Fsm";
export { Brain, type BrainOptions } from "./behavior/Brain";
export { STATES } from "./behavior/states";
export type { CritterContext, Expression, Pointer } from "./behavior/context";

// --- events (déclencheurs)
export { EventBus, type Listener } from "./events/EventBus";
export { attachDomTriggers, type CritterSink, type DomTriggerOptions } from "./events/triggers";

// --- render
export { blobSkin, type Skin, type SkinInput } from "./render/skins";
export {
  createScrubberSkin,
  createScrubberDrivenSkin,
  createPolisherSkin,
  createPolisherDrivenSkin,
  createBroomSkin,
  createBroomDrivenSkin,
} from "./render/machines";
export { SKIN_FACTORIES } from "./render/registry";
export { fitCanvas, clear, blobPath, starPath, mixHex } from "./render/draw";

// --- React
export { Critter, type CritterProps, type CritterHandle } from "./react/Critter";
