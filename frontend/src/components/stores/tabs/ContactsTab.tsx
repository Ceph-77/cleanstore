import { useState, type FormEvent } from "react";
import {
  useStoreContacts,
  useCreateStoreContact,
  useUpdateStoreContact,
  useDeleteStoreContact,
} from "../../../hooks/useStoreContacts";
import { Button } from "../../common/Button";
import { Field } from "../../common/Field";
import { Input } from "../../common/Input";
import { IconUser, IconTrash } from "../../common/icons";
import type { StoreContact } from "../../../types";

const emptyValues = { name: "", role: "", phone: "", email: "" };

export function ContactsTab({ storeId }: { storeId: string }) {
  const { data: contacts } = useStoreContacts(storeId);
  const createContact = useCreateStoreContact(storeId);
  const updateContact = useUpdateStoreContact(storeId);
  const deleteContact = useDeleteStoreContact(storeId);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [values, setValues] = useState(emptyValues);

  function startCreate() {
    setEditingId(null);
    setValues(emptyValues);
    setShowForm(true);
  }

  function startEdit(contact: StoreContact) {
    setEditingId(contact.id);
    setValues({
      name: contact.name,
      role: contact.role ?? "",
      phone: contact.phone ?? "",
      email: contact.email ?? "",
    });
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editingId) {
      await updateContact.mutateAsync({ id: editingId, data: values });
    } else {
      await createContact.mutateAsync(values);
    }
    setValues(emptyValues);
    setEditingId(null);
    setShowForm(false);
  }

  async function handleDelete(id: string, name: string) {
    if (confirm(`Supprimer le contact "${name}" ?`)) {
      await deleteContact.mutateAsync(id);
    }
  }

  const saving = createContact.isPending || updateContact.isPending;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-canvas-900">Contacts</h2>
        <Button variant="accent" onClick={startCreate}>
          + Ajouter un contact
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-4 rounded-2xl border border-flow-200 bg-flow-50/60 p-5"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nom">
              <Input required value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />
            </Field>
            <Field label="Rôle">
              <Input
                value={values.role}
                onChange={(e) => setValues({ ...values, role: e.target.value })}
                placeholder="ex: Sécurité, Urgence, Service technique"
              />
            </Field>
            <Field label="Téléphone">
              <Input value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} />
            </Field>
            <Field label="Courriel">
              <Input
                type="email"
                value={values.email}
                onChange={(e) => setValues({ ...values, email: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              Annuler
            </Button>
            <Button type="submit" variant="accent" disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-4 space-y-3">
        {contacts && contacts.length === 0 && (
          <p className="rounded-2xl border border-dashed border-canvas-300 bg-white px-6 py-10 text-center text-sm text-canvas-600">
            Aucun contact enregistré pour ce magasin.
          </p>
        )}
        {contacts?.map((contact) => (
          <div
            key={contact.id}
            className="flex items-center gap-4 rounded-2xl border border-canvas-200 bg-white p-4 shadow-sm shadow-canvas-900/5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-flow-100 text-flow-700 [&>svg]:h-4 [&>svg]:w-4">
              <IconUser />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-canvas-900">
                {contact.name}
                {contact.role && (
                  <span className="ml-2 rounded-full bg-linen-100 px-2 py-0.5 text-xs font-medium text-linen-800">
                    {contact.role}
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-canvas-600">
                {[contact.phone, contact.email].filter(Boolean).join(" · ") || "—"}
              </p>
            </div>
            <div className="flex shrink-0 gap-3 text-xs font-medium">
              <button onClick={() => startEdit(contact)} className="text-flow-700 hover:text-flow-900">
                Modifier
              </button>
              <button
                onClick={() => handleDelete(contact.id, contact.name)}
                className="text-canvas-600 hover:text-red-600"
                aria-label="Supprimer"
              >
                <IconTrash className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
