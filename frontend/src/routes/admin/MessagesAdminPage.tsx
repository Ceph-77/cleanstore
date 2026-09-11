import { Link } from "react-router-dom";
import { AppLayout } from "../../components/common/AppLayout";
import { LoadMore } from "../../components/common/LoadMore";
import { useAllThreadsAdmin } from "../../hooks/useMessages";
import type { MessageThread } from "../../types";

const KIND_LABELS: Record<MessageThread["kind"], string> = {
  task: "Tâche",
  clan: "Clan",
  global_jazzette: "Jazzette",
  global_annonces: "Annonces",
  adhoc: "Discussion libre",
};

function label(thread: MessageThread): string {
  if (thread.kind === "task") return thread.task?.description ?? "Tâche";
  if (thread.kind === "clan") return `Clan ${thread.clan?.name ?? ""}`.trim();
  if (thread.kind === "global_jazzette") return "Jazzette";
  if (thread.kind === "global_annonces") return "Annonces";
  return thread.title ?? "Discussion libre";
}

export function MessagesAdminPage() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useAllThreadsAdmin();
  const threads = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <AppLayout>
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-canvas-900">
        Messagerie — modération
      </h1>
      <p className="mt-1 text-sm text-canvas-600">
        Tous les fils actifs, tous types confondus. Les messages sont conservés indéfiniment.
      </p>

      {isLoading && <p className="mt-8 text-sm text-canvas-600">Chargement...</p>}

      {!isLoading && threads.length === 0 && (
        <p className="mt-8 rounded-2xl border border-dashed border-canvas-300 bg-white px-6 py-16 text-center text-sm text-canvas-600">
          Aucun fil actif pour l'instant.
        </p>
      )}

      <div className="mt-6 space-y-2">
        {threads.map((t) => {
          const last = t.messages?.[0];
          return (
            <Link
              key={t.id}
              to={`/messages/${t.id}`}
              className="flex items-center justify-between rounded-2xl border border-canvas-200 bg-white px-4 py-3 shadow-sm shadow-canvas-900/5 hover:bg-canvas-50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-canvas-900">
                  {label(t)}{" "}
                  <span className="text-xs font-normal text-canvas-600">({KIND_LABELS[t.kind]})</span>
                </p>
                {last && <p className="truncate text-xs text-canvas-600">{last.body}</p>}
              </div>
              <span className="shrink-0 text-xs text-canvas-600">{t._count?.messages ?? 0} message(s)</span>
            </Link>
          );
        })}
      </div>

      <LoadMore hasNextPage={!!hasNextPage} isFetching={isFetchingNextPage} onClick={() => fetchNextPage()} />
    </AppLayout>
  );
}
