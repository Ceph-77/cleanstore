import { useState, type FormEvent } from "react";
import { useStoreNotes, useCreateStoreNote, useDeleteStoreNote } from "../../../hooks/useStoreNotes";
import { Button } from "../../common/Button";
import { IconTrash } from "../../common/icons";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-CA", { dateStyle: "medium", timeStyle: "short" });
}

export function NotesTab({ storeId }: { storeId: string }) {
  const { data: notes } = useStoreNotes(storeId);
  const createNote = useCreateStoreNote(storeId);
  const deleteNote = useDeleteStoreNote(storeId);

  const [content, setContent] = useState("");

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
            <div className="flex items-start justify-between gap-3">
              <p className="whitespace-pre-line text-sm text-canvas-900">{note.content}</p>
              <button
                onClick={() => handleDelete(note.id)}
                className="shrink-0 text-canvas-600 hover:text-red-600"
                aria-label="Supprimer"
              >
                <IconTrash className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-canvas-600">
              {note.author?.fullName ?? note.author?.email ?? "Admin"} · {formatDateTime(note.createdAt)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
