import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AppLayout } from "../components/common/AppLayout";
import { Button } from "../components/common/Button";
import { useAuth } from "../context/AuthContext";
import { IconChat, IconStore, IconUser, IconWallet } from "../components/common/icons";
import {
  useMyThreads,
  useThreadMessages,
  usePostMessage,
  useEditMessage,
  useTaskThread,
  useClanThread,
} from "../hooks/useMessages";
import type { Message, MessageThread } from "../types";

const EDIT_WINDOW_MINUTES = 15;

function threadLabel(thread: MessageThread): string {
  switch (thread.kind) {
    case "global_jazzette":
      return "Jazzette";
    case "global_annonces":
      return "Annonces";
    case "task":
      return thread.task?.description ?? "Discussion de tâche";
    case "clan":
      return `Clan ${thread.clan?.name ?? ""}`.trim();
    default:
      return thread.title ?? "Discussion";
  }
}

function threadIcon(kind: MessageThread["kind"]) {
  if (kind === "task") return <IconWallet className="h-4 w-4" />;
  if (kind === "clan") return <IconUser className="h-4 w-4" />;
  if (kind === "global_annonces") return <IconStore className="h-4 w-4" />;
  return <IconChat className="h-4 w-4" />;
}

function ThreadList({
  threads,
  activeId,
  onSelect,
}: {
  threads: MessageThread[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="max-h-[32rem] space-y-1 overflow-y-auto rounded-2xl border border-canvas-200 bg-white p-2 shadow-sm shadow-canvas-900/5 sm:max-h-[60vh]">
      {threads.map((t) => {
        const last = t.messages?.[0];
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors ${
              activeId === t.id ? "bg-flow-50 ring-1 ring-flow-200" : "hover:bg-canvas-50"
            }`}
          >
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-flow-100 text-flow-700">
              {threadIcon(t.kind)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-canvas-900">{threadLabel(t)}</span>
              {last && <span className="block truncate text-xs text-canvas-600">{last.body}</span>}
            </span>
          </button>
        );
      })}
      {threads.length === 0 && <p className="px-3 py-4 text-sm text-canvas-600">Aucune discussion.</p>}
    </div>
  );
}

function MessageRow({
  message,
  isMine,
  onEdit,
}: {
  message: Message;
  isMine: boolean;
  onEdit: (id: string, body: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const ageMinutes = (Date.now() - new Date(message.createdAt).getTime()) / 60000;
  const canEdit = isMine && ageMinutes <= EDIT_WINDOW_MINUTES;

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
          isMine ? "bg-flow-600 text-white" : "bg-canvas-100 text-canvas-900"
        }`}
      >
        {!isMine && (
          <p className="mb-0.5 text-xs font-semibold opacity-70">
            {message.author?.fullName ?? message.author?.email ?? "—"}
          </p>
        )}
        {editing ? (
          <div className="space-y-1.5">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-canvas-300 bg-white px-2 py-1 text-sm text-canvas-900"
            />
            <div className="flex justify-end gap-1.5">
              <button className="text-xs opacity-80" onClick={() => setEditing(false)}>
                Annuler
              </button>
              <button
                className="text-xs font-semibold underline"
                onClick={() => {
                  onEdit(message.id, draft.trim());
                  setEditing(false);
                }}
              >
                Enregistrer
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="whitespace-pre-line">{message.body}</p>
            <p className={`mt-1 text-[10px] ${isMine ? "text-white/70" : "text-canvas-600"}`}>
              {new Date(message.createdAt).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}
              {message.editedAt && " · modifié"}
              {canEdit && (
                <button className="ml-2 underline" onClick={() => setEditing(true)}>
                  modifier
                </button>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function ThreadView({ threadId }: { threadId: string }) {
  const { user } = useAuth();
  const { data, isLoading } = useThreadMessages(threadId);
  const postMessage = usePostMessage(threadId);
  const editMessage = useEditMessage(threadId);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const messages = useMemo(() => {
    const pages = data?.pages.flatMap((p) => p.items) ?? [];
    return [...pages].reverse(); // pages arrivent en desc (récent -> ancien), on affiche chronologique
  }, [data]);
  const thread = data?.pages[0]?.thread;
  const canPost = thread?.kind !== "global_annonces" || user?.roleKeys?.includes("admin");

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setError(null);
    try {
      await postMessage.mutateAsync(draft.trim());
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer le message.");
    }
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-canvas-200 bg-white shadow-sm shadow-canvas-900/5">
      <div className="border-b border-canvas-200 px-4 py-3">
        <p className="font-heading text-sm font-semibold text-canvas-900">{thread ? threadLabel(thread) : "..."}</p>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-4" style={{ minHeight: "20rem", maxHeight: "50vh" }}>
        {isLoading && <p className="text-sm text-canvas-600">Chargement...</p>}
        {!isLoading && messages.length === 0 && (
          <p className="text-sm text-canvas-600">Aucun message pour l'instant — dis bonjour !</p>
        )}
        {messages.map((m) => (
          <MessageRow
            key={m.id}
            message={m}
            isMine={m.authorId === user?.id}
            onEdit={(id, body) => editMessage.mutate({ id, body })}
          />
        ))}
      </div>
      {canPost ? (
        <form onSubmit={handleSend} className="flex items-end gap-2 border-t border-canvas-200 p-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={1}
            placeholder="Écrire un message..."
            className="flex-1 resize-none rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
          />
          <Button type="submit" variant="accent" disabled={postMessage.isPending || !draft.trim()}>
            Envoyer
          </Button>
        </form>
      ) : (
        <p className="border-t border-canvas-200 p-3 text-xs text-canvas-600">
          Seul un administrateur peut publier dans les annonces.
        </p>
      )}
      {error && <p className="px-3 pb-3 text-xs text-red-700">{error}</p>}
    </div>
  );
}

export function MessagesPage() {
  const { threadId: routeThreadId } = useParams<{ threadId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: threads } = useMyThreads();
  const taskId = searchParams.get("task");
  const clanId = searchParams.get("clan");
  const { data: resolvedTaskThread } = useTaskThread(taskId);
  const { data: resolvedClanThread } = useClanThread(clanId);

  const [activeId, setActiveId] = useState<string | null>(routeThreadId ?? null);

  useEffect(() => {
    if (routeThreadId) setActiveId(routeThreadId);
  }, [routeThreadId]);

  useEffect(() => {
    if (resolvedTaskThread) {
      setActiveId(resolvedTaskThread.id);
      navigate(`/messages/${resolvedTaskThread.id}`, { replace: true });
    }
  }, [resolvedTaskThread, navigate]);

  useEffect(() => {
    if (resolvedClanThread) {
      setActiveId(resolvedClanThread.id);
      navigate(`/messages/${resolvedClanThread.id}`, { replace: true });
    }
  }, [resolvedClanThread, navigate]);

  useEffect(() => {
    if (!activeId && threads && threads.length > 0) {
      setActiveId(threads[0]!.id);
    }
  }, [activeId, threads]);

  return (
    <AppLayout>
      <p className="text-xs font-semibold uppercase tracking-wider text-flow-600">Messagerie</p>
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-canvas-900">Messages</h1>
      <p className="mt-1 text-sm text-canvas-600">
        Fils par tâche, par clan, Jazzette (ouvert à tous) et Annonces (l'admin publie, tout le monde lit).
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-[18rem_1fr]">
        <ThreadList
          threads={threads ?? []}
          activeId={activeId}
          onSelect={(id) => {
            setActiveId(id);
            navigate(`/messages/${id}`);
          }}
        />
        <div className="min-h-[24rem]">
          {activeId ? <ThreadView threadId={activeId} /> : (
            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-canvas-300 p-10 text-sm text-canvas-600">
              Choisis une discussion.
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
