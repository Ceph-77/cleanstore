import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppLayout } from "../components/common/AppLayout";
import { useStore } from "../hooks/useStores";
import { IconStore } from "../components/common/icons";
import { StoreTabs, type StoreTabKey } from "../components/stores/StoreTabs";
import { OverviewTab } from "../components/stores/tabs/OverviewTab";
import { ContactsTab } from "../components/stores/tabs/ContactsTab";
import { DocumentsTab } from "../components/stores/tabs/DocumentsTab";
import { NotesTab } from "../components/stores/tabs/NotesTab";
import { InvoicesTab } from "../components/stores/tabs/InvoicesTab";

export function StoreDetailPage() {
  const { id } = useParams<{ id: string }>();
  const storeId = id!;
  const { data: store, isLoading } = useStore(storeId);
  const [tab, setTab] = useState<StoreTabKey>("apercu");

  if (isLoading || !store) {
    return (
      <AppLayout>
        <p className="text-sm text-canvas-600">Chargement...</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Link to="/stores" className="text-sm text-flow-700 hover:text-flow-900">
        ← Tous les magasins
      </Link>

      <div className="mt-3 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-flow-100 text-flow-700">
          <IconStore className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-canvas-900">{store.name}</h1>
          {store.banner && (
            <span className="mt-0.5 inline-block rounded-full bg-linen-100 px-2 py-0.5 text-xs font-medium text-linen-800">
              {store.banner}
            </span>
          )}
        </div>
      </div>

      <div className="mt-6">
        <StoreTabs active={tab} onChange={setTab} />
      </div>

      <div className="mt-6">
        {tab === "apercu" && <OverviewTab store={store} />}
        {tab === "contacts" && <ContactsTab storeId={storeId} />}
        {tab === "documents" && <DocumentsTab storeId={storeId} />}
        {tab === "notes" && <NotesTab storeId={storeId} />}
        {tab === "finances" && <InvoicesTab storeId={storeId} />}
      </div>
    </AppLayout>
  );
}
