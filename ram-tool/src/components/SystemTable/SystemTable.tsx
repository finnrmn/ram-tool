import type { Component } from "../../types";
import type { ComponentPatch } from "../../store/useScenarioStore";
import ComponentRow from "./ComponentRow";

type SystemTableProps = {
  components: Component[];
  onUpdateComponent: (id: string, patch: ComponentPatch) => void;
  onRemoveComponent: (id: string) => void;
};

const SystemTable = ({ components, onUpdateComponent, onRemoveComponent }: SystemTableProps) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Systemkomponenten</h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">{components.length} aktiv</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-900/70 dark:text-slate-400">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Name</th>
              <th className="px-4 py-2 text-left font-medium">Verteilung</th>
              <th className="px-4 py-2 text-left font-medium normal-case">λ</th>
              <th className="px-4 py-2 text-left font-medium">MTBF</th>
              <th className="px-4 py-2 text-left font-medium">MTTR</th>
              <th className="px-4 py-2 text-right font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {components.map((component) => (
              <ComponentRow
                key={component.id}
                component={component}
                onUpdate={onUpdateComponent}
                onRemove={onRemoveComponent}
              />
            ))}
          </tbody>
        </table>
      </div>
      {components.length === 0 && (
        <p className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">Füge Komponenten hinzu, um das System zu beschreiben.</p>
      )}
    </div>
  );
};

export default SystemTable;
