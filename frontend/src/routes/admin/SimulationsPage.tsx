import { useEffect, useRef } from "react";
import { AppLayout } from "../../components/common/AppLayout";
import { Critter, type CritterHandle } from "../../critter";
import type { CritterProps } from "../../critter/react/Critter";

/**
 * Formation passive : les machines les plus réservées tournent en boucle,
 * bon geste puis erreur courante — rien à cliquer. Admin seulement pour
 * l'instant (Céphas, 2026-09-11 : "vas-y mais pour l'instant ça n'affiche
 * que chez l'admin pas les user le temps je l'analyse") ; l'aller vers les
 * travailleurs (l'idée d'origine) reste une décision séparée à venir.
 */
const MACHINES: { skin: CritterProps["skin"]; name: string; sub: string }[] = [
  { skin: "scrubber", name: "Autorécureuse", sub: "Récurage + aspiration" },
  { skin: "polisher-driven", name: "Polisseuse haute vitesse", sub: "Lustrage / polissage" },
  { skin: "broom", name: "Vadrouille à plat", sub: "Dépoussiérage à sec (microfibre)" },
];

function MachinePanel({ skin, name, sub, phase }: { skin: CritterProps["skin"]; name: string; sub: string; phase: number }) {
  const handleRef = useRef<CritterHandle | null>(null);
  const toggleRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      toggleRef.current = !toggleRef.current;
      handleRef.current?.sendEvent({ type: toggleRef.current ? "error" : "success" });
    }, 7000 + phase * 900);
    return () => clearInterval(id);
  }, [phase]);

  return (
    <div className="rounded-2xl border border-canvas-200 bg-white shadow-sm shadow-canvas-900/5">
      <div className="border-b border-canvas-100 px-5 py-4">
        <h3 className="font-heading text-sm font-semibold text-canvas-900">{name}</h3>
        <p className="mt-0.5 text-xs text-canvas-600">{sub}</p>
      </div>
      <div className="h-52 bg-canvas-50">
        <Critter
          skin={skin}
          seed={name}
          idleAfter={0}
          onReady={(h) => {
            handleRef.current = h;
          }}
        />
      </div>
    </div>
  );
}

export function SimulationsPage() {
  return (
    <AppLayout>
      <p className="text-xs font-semibold uppercase tracking-wider text-flow-600">Gestion · Formation passive</p>
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-canvas-900">
        Simulations — gestes &amp; erreurs
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-canvas-600">
        Les trois machines les plus réservées tournent en continu : le bon geste, puis l'erreur
        courante et sa conséquence. Rien à cliquer — à force de passer devant, l'œil retient.
      </p>
      <p className="mt-2 max-w-2xl rounded-xl bg-linen-100/60 px-3 py-2 text-xs text-canvas-700">
        Page réservée à l'administration pour l'instant, le temps de valider l'idée — les
        travailleurs ne la voient pas encore.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
        {MACHINES.map((m, i) => (
          <MachinePanel key={m.name} skin={m.skin} name={m.name} sub={m.sub} phase={i} />
        ))}
      </div>
    </AppLayout>
  );
}
