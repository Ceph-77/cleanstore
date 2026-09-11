/**
 * Binding React : monte un <canvas> responsive, instancie le moteur, branche les
 * déclencheurs, nettoie tout au démontage. React ne touche jamais la boucle.
 *
 *   <Critter />                       // mascotte autonome
 *   <Critter skin="scrubber" />       // devient l'autorécureuse
 *   <Critter skin="scrubber-driven" /> // + un petit opérateur qui la pousse
 *   const ref = useRef<CritterHandle>(null);
 *   <Critter ref={ref} />
 *   ref.current?.sendEvent({ type: "success" });   // depuis la console
 */
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type CSSProperties,
} from "react";
import type { AppEvent, StateName, View } from "../core/types";
import { Critter as Engine } from "../engine/Critter";
import { RenderLoop } from "../engine/RenderLoop";
import { attachDomTriggers } from "../events/triggers";
import { fitCanvas, clear } from "../render/draw";
import type { Skin } from "../render/skins";
import { SKIN_FACTORIES } from "../render/registry";

export interface CritterHandle {
  sendEvent(e: AppEvent): void;
  getState(): StateName;
}

export interface CritterProps {
  /** Nom de skin enregistré, ou fonction de rendu directe. Défaut "blob". */
  skin?: keyof typeof SKIN_FACTORIES | Skin;
  /** Graine déterministe. Deux critters de même graine se comportent pareil. */
  seed?: string | number;
  /** Met la simulation en pause (le dernier rendu reste affiché). */
  paused?: boolean;
  /** Secondes d'inactivité avant l'événement `wait`. 0 = off. Défaut 12. */
  idleAfter?: number;
  className?: string;
  style?: CSSProperties;
  onReady?: (handle: CritterHandle) => void;
}

/**
 * Un nom enregistré passe par sa FABRIQUE — chaque appel crée une fermeture
 * d'animation fraîche (voir machines.ts), donc un montage n'hérite jamais de
 * l'état d'un autre critter. Une fonction passée directement est utilisée
 * telle quelle (l'appelant est responsable de son propre état s'il en a).
 */
const resolveSkin = (skin: CritterProps["skin"]): Skin =>
  typeof skin === "function" ? skin : (SKIN_FACTORIES[skin ?? "blob"] ?? SKIN_FACTORIES.blob)();

export const Critter = forwardRef<CritterHandle, CritterProps>(function Critter(
  { skin, seed, paused = false, idleAfter = 12, className, style, onReady },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const loopRef = useRef<RenderLoop | null>(null);
  /** Préférence système lue une fois au montage — jamais de mouvement forcé si l'utilisateur l'a désactivé. */
  const reducedMotionRef = useRef(false);

  // instanciation + cycle de vie (une seule fois)
  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    reducedMotionRef.current =
      typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const view: View = {
      width: host.clientWidth || 240,
      height: host.clientHeight || 160,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
    };
    let g = fitCanvas(canvas, view);

    const engine = new Engine({ view, seed, skin: resolveSkin(skin) });
    engineRef.current = engine;

    const loop = new RenderLoop({
      update: (dt, elapsed) => engine.update(dt, elapsed),
      render: (alpha, elapsed) => {
        clear(g, view);
        engine.render(g, { alpha, elapsed, view });
      },
    });
    loopRef.current = loop;

    const detachTriggers = attachDomTriggers(engine, {
      element: canvas,
      getView: () => view,
      idleAfter,
    });

    const ro = new ResizeObserver(() => {
      view.width = host.clientWidth || view.width;
      view.height = host.clientHeight || view.height;
      g = fitCanvas(canvas, view);
      engine.resize(view);
    });
    ro.observe(host);

    if (!paused && !reducedMotionRef.current) {
      loop.start();
    } else {
      // pose figée plutôt qu'un canvas vide : un pas minuscule, un rendu, rien de plus.
      engine.update(1 / 60, 0);
      clear(g, view);
      engine.render(g, { alpha: 0, elapsed: 0, view });
    }

    const handle: CritterHandle = {
      sendEvent: (e) => engine.sendEvent(e),
      getState: () => engine.state,
    };
    onReady?.(handle);

    return () => {
      loop.stop();
      detachTriggers();
      ro.disconnect();
      engineRef.current = null;
      loopRef.current = null;
    };
    // seed/idleAfter figés à la création ; skin & paused gérés plus bas
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // changement de skin sans recréer le moteur
  useEffect(() => {
    engineRef.current?.setSkin(resolveSkin(skin));
  }, [skin]);

  // pause / reprise (jamais de reprise si le système demande moins de mouvement)
  useEffect(() => {
    const loop = loopRef.current;
    if (!loop) return;
    if (paused || reducedMotionRef.current) loop.stop();
    else loop.start();
  }, [paused]);

  useImperativeHandle(
    ref,
    (): CritterHandle => ({
      sendEvent: (e) => engineRef.current?.sendEvent(e),
      getState: () => engineRef.current?.state ?? "idle",
    }),
    [],
  );

  return (
    <div
      ref={hostRef}
      className={className}
      style={{ position: "relative", width: "100%", height: "100%", ...style }}
    >
      <canvas ref={canvasRef} style={{ display: "block", touchAction: "none" }} />
    </div>
  );
});
