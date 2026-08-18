import { useRef, useState } from "react";
import {
  useStoreDocuments,
  useUploadStoreDocument,
  useDeleteStoreDocument,
} from "../../../hooks/useStoreDocuments";
import { Button } from "../../common/Button";
import { IconFile, IconTrash, IconDownload } from "../../common/icons";
import { ApiError } from "../../../api/client";

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function DocumentsTab({ storeId }: { storeId: string }) {
  const { data: documents } = useStoreDocuments(storeId);
  const uploadDocument = useUploadStoreDocument(storeId);
  const deleteDocument = useDeleteStoreDocument(storeId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      await uploadDocument.mutateAsync(file);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Échec du téléversement. Le stockage de fichiers (Cloudflare R2) est peut-être pas encore configuré."
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(id: string, fileName: string) {
    if (confirm(`Supprimer le document "${fileName}" ?`)) {
      await deleteDocument.mutateAsync(id);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-canvas-900">Documents</h2>
        <Button variant="accent" onClick={() => fileInputRef.current?.click()} disabled={uploadDocument.isPending}>
          {uploadDocument.isPending ? "Téléversement..." : "+ Téléverser un fichier"}
        </Button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="mt-4 space-y-3">
        {documents && documents.length === 0 && (
          <p className="rounded-2xl border border-dashed border-canvas-300 bg-white px-6 py-10 text-center text-sm text-canvas-600">
            Aucun document pour ce magasin. Contrat signé, plan des lieux, certificats d'assurance...
          </p>
        )}
        {documents?.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center gap-4 rounded-2xl border border-canvas-200 bg-white p-4 shadow-sm shadow-canvas-900/5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-linen-100 text-linen-700 [&>svg]:h-4 [&>svg]:w-4">
              <IconFile />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-canvas-900">{doc.fileName}</p>
              <p className="mt-0.5 text-xs text-canvas-600">{formatSize(doc.sizeBytes)}</p>
            </div>
            {doc.downloadUrl && (
              <a
                href={doc.downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="text-flow-700 hover:text-flow-900"
                aria-label="Télécharger"
              >
                <IconDownload className="h-4 w-4" />
              </a>
            )}
            <button
              onClick={() => handleDelete(doc.id, doc.fileName)}
              className="text-canvas-600 hover:text-red-600"
              aria-label="Supprimer"
            >
              <IconTrash className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
