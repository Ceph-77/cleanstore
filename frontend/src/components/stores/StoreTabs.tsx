export type StoreTabKey = "apercu" | "contacts" | "documents" | "notes" | "finances" | "inspections";

const TABS: { key: StoreTabKey; label: string }[] = [
  { key: "apercu", label: "Aperçu" },
  { key: "contacts", label: "Contacts" },
  { key: "documents", label: "Documents" },
  { key: "notes", label: "Notes" },
  { key: "finances", label: "Finances" },
  { key: "inspections", label: "Inspections" },
];

export function StoreTabs({ active, onChange }: { active: StoreTabKey; onChange: (tab: StoreTabKey) => void }) {
  return (
    <div className="overflow-x-auto border-b border-canvas-200">
      <nav className="-mb-px flex gap-6 whitespace-nowrap">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`shrink-0 border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
              active === tab.key
                ? "border-flow-500 text-flow-700"
                : "border-transparent text-canvas-600 hover:border-canvas-300 hover:text-canvas-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
