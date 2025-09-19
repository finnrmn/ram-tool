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
    <div className="rounded-lg border border-slate-800 bg-slate-900/70">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Systemkomponenten</h2>
        <span className="text-xs text-slate-500">{components.length} aktiv</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Name</th>
              <th className="px-4 py-2 text-left font-medium">Verteilung</th>
              <th className="px-4 py-2 text-left font-medium">λ</th>
              <th className="px-4 py-2 text-left font-medium">MTBF</th>
              <th className="px-4 py-2 text-left font-medium">MTTR</th>
              <th className="px-4 py-2 text-right font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
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
        <p className="px-4 py-3 text-sm text-slate-400">Füge Komponenten hinzu, um das System zu beschreiben.</p>
      )}
    </div>
  );
};

export default SystemTable;
