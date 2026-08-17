import { useState, type FormEvent } from "react";
import {
  useStoreNotes,
  useCreateStoreNote,
  useUpdateStoreNote,
  useDeleteStoreNote,
} from "../../../hooks/useStoreNotes";
import { Button } from "../../common/Button";
import { IconTrash } from "../../common/icons";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-CA", { dateStyle: "medium", timeStyle: "short" });
}

export function NotesTab({ storeId }: { storeId: string }) {
  const { data: notes } = useStoreNotes(storeId);
  const createNote = useCreateStoreNote(storeId);
  const updateNote = useUpdateStoreNote(storeId);
  const deleteNote = useDeleteStoreNote(storeId);

  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    await createNote.mutateAsync(content.trim());
    setContent("");
  }

  async function handleDelete(id: string) {
    if (confirm("Supprimer cette note ?")) {
      await deleteNote.mutateAsync(id);
    }
  }

  async function handleSaveEdit(id: string) {
    if (!editingContent.trim()) return;
    await updateNote.mutateAsync({ id, content: editingContent.trim() });
    setEditingId(null);
  }

  return (
    <div>
      <h2 className="font-heading text-lg font-semibold text-canvas-900">Notes</h2>

      <form
        onSubmit={handleSubmit}
        className="mt-4 space-y-3 rounded-2xl border border-flow-200 bg-flow-50/60 p-5"
      >
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="Ajouter une note (communication avec le magasin, changement de sous-traitant, etc.)"
          className="w-full rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
        />
        <div className="flex justify-end">
          <Button type="submit" variant="accent" disabled={createNote.isPending || !content.trim()}>
            {createNote.isPending ? "Ajout..." : "Ajouter la note"}
          </Button>
        </div>
      </form>

      <div className="mt-6 space-y-4">
        {notes && notes.length === 0 && (
          <p className="rounded-2xl border border-dashed border-canvas-300 bg-white px-6 py-10 text-center text-sm text-canvas-600">
            Aucune note pour ce magasin pour l'instant.
          </p>
        )}
        {notes?.map((note) => (
          <div key={note.id} className="rounded-2xl border border-canvas-200 bg-white p-4 shadow-sm shadow-canvas-900/5">
            {editingId === note.id ? (
              <div className="space-y-2">
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => setEditingId(null)}>
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    variant="accent"
                    disabled={updateNote.isPending}
                    onClick={() => handleSaveEdit(note.id)}
                  >
                    {updateNote.isPending ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <p className="whitespace-pre-line text-sm text-canvas-900">{note.content}</p>
                  <div className="flex shrink-0 gap-3 text-xs font-medium">
                    <button
                      onClick={() => {
                        setEditingId(note.id);
                        setEditingContent(note.content);
                      }}
                      className="text-flow-700 hover:text-flow-900"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="text-canvas-600 hover:text-red-600"
                      aria-label="Supprimer"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-canvas-600">
                  {note.author?.fullName ?? note.author?.email ?? "Admin"} · {formatDateTime(note.createdAt)}
                </p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
