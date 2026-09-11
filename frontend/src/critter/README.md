# `critter` — module d'animation procédurale réactive

Un élément visuel autonome, piloté par une **machine à états finis**, qui se
déplace de façon fluide et non répétitive (bruit de Perlin + physique 2D) et
**réagit aux événements de l'application** (succès, erreur, attente, clic).

Pensé pour KLEAN'STOR (React + TypeScript + Canvas), mais le cœur est du
TypeScript pur : aucune dépendance React dans la boucle, donc testable seul et
portable.

---

## Architecture — 3 couches séparées

```
core/        primitives déterministes, sans état d'app
  types.ts       Vec2, View, AppEvent, Mood…
  vec2.ts        maths vectorielles (+ variantes in-place, zéro alloc/frame)
  rng.ts         PRNG seedé (mulberry32) + weightedPick
  noise.ts       bruit de Perlin 1D/2D/fBm seedé

engine/      ── BOUCLE DE RENDU ────────────────────────────────
  RenderLoop.ts   RAF + pas de temps FIXE (accumulateur), interpolation,
                  clamp onglet caché, garde anti spirale-de-la-mort, auto-pause
  Physics.ts      Body : forces → inertie → amortissement ; seek / arrive / contain
  Critter.ts      l'entité : assemble physique + FSM + Brain + skin

behavior/    ── LOGIQUE COMPORTEMENTALE (FSM) ──────────────────
  Fsm.ts          machine à états générique (onEnter/onExit/update/onEvent)
  context.ts      CritterContext : seule surface FSM ↔ monde
  states.ts       7 états : idle · curious · distracted · working
                            · success · error · poked
  Brain.ts        sélecteur d'états ambiants aléatoire CONTRÔLÉ
                  (tirage pondéré par l'humeur + cooldowns + dwell mini)

events/      ── DÉCLENCHEURS D'ÉVÉNEMENTS ──────────────────────
  EventBus.ts     pub/sub typé (frontière app ↔ critter)
  triggers.ts     DOM (pointeur, focus/blur) + détection d'attente prolongée
                  → AppEvent

render/
  draw.ts         helpers canvas (DPR, formes, mix couleur)
  skins.ts        blobSkin (défaut)
  machines.ts     skins machine réels : scrubber/polisher/broom (+ variantes
                  "-driven" avec un petit opérateur) — tracés repris de la
                  maquette Simulations.dc.html, portés en Path2D
  registry.ts     SKINS (nom -> fonction de rendu), séparé de skins.ts pour
                  éviter un import circulaire avec machines.ts

react/
  Critter.tsx     <Critter> : monte le canvas, instancie le moteur, nettoie
```

**Flux d'une frame :**

```
RenderLoop
  ├─ update(dt fixe)  ×N   →  Brain.tick → Fsm.transitionTo?
  │                          Fsm.update  → l'état applique une force de steering
  │                          Body.integrate(dt)   (Euler semi-implicite)
  │                          humeur relâchée vers le repos
  └─ render(alpha)         →  position interpolée → Skin(ctx2d)
```

## Modèle de comportement

| Type | États | Déclenché par |
|------|-------|---------------|
| **Ambiant** | `idle`, `curious`, `distracted`, `working` | `Brain` (hasard contrôlé) |
| **Réactif** | `success`, `error`, `poked` | `AppEvent` via la FSM |

- **`working`** = va-et-vient en serpentin : le clin d'œil au « geste de la
  machine » (récurage / balayage). Les skins machine viendront le renforcer.
- **Humeur** (`{ arousal, valence }`) : poussée par les stimuli, retombe vers le
  repos. Elle module les poids du `Brain` et la couleur / les sourcils du skin.
- **Bruit de Perlin** : chaque critter a un `wanderSeed` propre → même moteur,
  styles de déplacement différents.

## Usage

```tsx
import { Critter, type CritterHandle } from "@/critter";
import { useRef } from "react";

function Panel() {
  const critter = useRef<CritterHandle>(null);

  // quand une tâche réussit / échoue dans la console :
  // critter.current?.sendEvent({ type: "success" });
  // critter.current?.sendEvent({ type: "error", at: { x, y } });

  return (
    <div style={{ width: 220, height: 150 }}>
      <Critter ref={critter} seed="panel-1" idleAfter={15} />
    </div>
  );
}
```

Moteur seul (test, Node, autre framework) :

```ts
import { CritterEngine, RenderLoop } from "@/critter";
const engine = new CritterEngine({ view: { width: 300, height: 200, dpr: 1 } });
const loop = new RenderLoop({
  update: (dt, t) => engine.update(dt, t),
  render: (a, t) => engine.render(ctx2d, { alpha: a, elapsed: t, view }),
});
loop.start();
```

## État & prochaines étapes

- [x] Structure + boucle de rendu à pas fixe + interpolation
- [x] Bruit de Perlin seedé, physique (Body/seek/arrive/contain)
- [x] FSM générique + 7 états + Brain (hasard contrôlé par l'humeur)
- [x] EventBus + déclencheurs DOM + détection d'attente
- [x] Skin « blob » expressif (squash-stretch, yeux, sourcils, éclats/poussière)
- [x] Skins machine réels : `scrubber`, `polisher`, `broom` — silhouettes
      reprises de la maquette Simulations (Path2D), disque/roue en dash-chase
      pendant "working", pose "erreur métier" par machine (raclette relevée +
      traînée mouillée / polisseuse arrêtée qui brûle + fumée / vadrouille
      soulevée + poussière qui retombe). Variantes `xxx-driven` : petit
      opérateur (langage visuel du blob) qui pousse la machine.
  - Démo isolée (avant intégration) : https://claude.ai/code/artifact/8d0880e0-9316-48c2-9b39-ce22d2aca15e
- [x] Poses machine adoucies : chaque skin machine est une FABRIQUE
      (`createXxxSkin`) qui referme sur un état d'animation propre à
      l'instance (angle de raclette, vitesse/inertie du disque, sens affiché
      avec hystérésis) et le fait DÉRIVER vers sa cible (`approach`, decay
      exponentiel indépendant du framerate) au lieu de sauter dessus — retour
      de Céphas : "trop robotique, moins naturel".
- [x] Transformation animée au changement de skin : `engine/Critter.ts`
      dessine une bascule générique (rétraction en rotation → éclair
      mécanique → déploiement en sens inverse) entre l'ancien et le nouveau
      skin sur `setSkin()`, plutôt qu'un cut — "comme dans Transformers"
      (retour de Céphas). Ne connaît ni le blob ni les machines, marche avec
      n'importe quelle paire de fonctions `Skin`.
- [x] `prefers-reduced-motion` : `react/Critter.tsx` lit la préférence une
      fois au montage, ne démarre jamais la boucle si elle est active (pose
      figée après un micro-pas plutôt qu'un canvas vide), et le respecte
      aussi si `paused` repasse à `false` ensuite.
- [x] Décision d'intégration (2026-09-11, Céphas : "vas-y mais pour l'instant
      ça n'affiche que chez l'admin pas les user le temps je l'analyse") :
      page `/admin/simulations`, **admin seulement** — voir
      `routes/admin/SimulationsPage.tsx`. Pas encore montré aux travailleurs
      (l'idée d'origine, "formation sans cadre" passive pendant le travail,
      reste à valider une fois que Céphas aura observé la page lui-même).
- [ ] Tests vitest : déterminisme (même seed ⇒ même trajectoire), transitions
      FSM, `weightedPick`, boucle (accumulateur / clamp)
