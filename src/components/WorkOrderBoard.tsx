import React, { useMemo } from 'react';
import { ClipboardList, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { WorkOrderProgress } from '../types';
import { StorageService } from '../services/storage';

/*
 * Work order progress board.
 *
 * Every figure here is derived from production entries at render time — no
 * progress is stored on the order itself, so the board cannot drift out of
 * sync with the runs that produced it.
 */
export const WorkOrderBoard: React.FC = () => {
  const progress: WorkOrderProgress[] = useMemo(
    () => StorageService.getWorkOrderProgress(),
    []
  );

  const totalPlanned = progress.reduce((s, p) => s + p.workOrder.plannedQty, 0);
  const totalAchieved = progress.reduce((s, p) => s + p.achievedQty, 0);
  const overdueCount = progress.filter(p => p.isOverdue).length;
  const completedCount = progress.filter(p => p.workOrder.status === 'Completed').length;

  const statusStyle = (p: WorkOrderProgress) => {
    if (p.workOrder.status === 'Completed') return 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60';
    if (p.isOverdue) return 'bg-rose-950/80 text-rose-300 border-rose-600/60';
    if (p.achievedQty > 0) return 'bg-sky-950/80 text-sky-300 border-sky-600/60';
    return 'bg-panel-raised text-content-muted border-panel-line';
  };

  const priorityStyle = (priority: string) =>
    priority === 'Urgent'
      ? 'bg-rose-900/60 text-rose-200 border-rose-600/60'
      : priority === 'High'
        ? 'bg-amber-900/60 text-amber-200 border-amber-600/60'
        : 'bg-panel-raised text-content-muted border-panel-line';

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">

      <div>
        <h1 className="text-xl font-black text-content flex items-center space-x-2">
          <ClipboardList className="w-5 h-5 text-emerald-400" />
          <span>Work Orders</span>
        </h1>
        <p className="text-xs text-content-faint mt-0.5">
          Planned jobs and their progress. Output is rolled up from every production run booked against each order.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-table rounded-2xl p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-content-muted">Open Orders</div>
          <div className="text-xl font-black font-mono text-content mt-2">{progress.length - completedCount}</div>
          <div className="text-[10px] text-content-faint mt-1">of {progress.length} total</div>
        </div>
        <div className="glass-table rounded-2xl p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-content-muted">Planned Units</div>
          <div className="text-xl font-black font-mono text-sky-300 mt-2">{totalPlanned.toLocaleString()}</div>
          <div className="text-[10px] text-content-faint mt-1">across all orders</div>
        </div>
        <div className="glass-table rounded-2xl p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-content-muted">Built To Date</div>
          <div className="text-xl font-black font-mono text-emerald-400 mt-2">{totalAchieved.toLocaleString()}</div>
          <div className="text-[10px] text-content-faint mt-1">
            {totalPlanned > 0 ? Math.round((totalAchieved / totalPlanned) * 100) : 0}% of plan
          </div>
        </div>
        <div className="glass-table rounded-2xl p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-content-muted">Overdue</div>
          <div className={`text-xl font-black font-mono mt-2 ${overdueCount > 0 ? 'text-rose-400' : 'text-content'}`}>
            {overdueCount}
          </div>
          <div className="text-[10px] text-content-faint mt-1">past due date, short of plan</div>
        </div>
      </div>

      {/* Orders */}
      <div className="glass-table rounded-2xl p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-panel-line-subtle text-content-muted font-semibold">
                <th className="py-2.5 px-3">Work Order</th>
                <th className="py-2.5 px-3">Product / Line</th>
                <th className="py-2.5 px-3 text-right">Planned</th>
                <th className="py-2.5 px-3 text-right">Built</th>
                <th className="py-2.5 px-3">Progress</th>
                <th className="py-2.5 px-3 text-center">Runs</th>
                <th className="py-2.5 px-3">Due</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel-line-subtle">
              {progress.map((p) => (
                <tr key={p.workOrder.id} className="hover:bg-panel-raised/40 transition">
                  <td className="py-3 px-3">
                    <span className="font-mono text-[11px] font-bold px-2 py-1 rounded-md bg-emerald-950/70 text-emerald-300 border border-emerald-700/60 whitespace-nowrap">
                      {p.workOrder.workOrderNumber}
                    </span>
                    <div className="mt-1">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border ${priorityStyle(p.workOrder.priority)}`}>
                        {p.workOrder.priority}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-content-soft">{p.workOrder.product}</div>
                    <div className="text-[10px] text-content-faint font-mono mt-0.5">
                      {p.workOrder.productCode} · {p.workOrder.productionLine}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-content-dim">
                    {p.workOrder.plannedQty.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                    {p.achievedQty.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 min-w-[140px]">
                    <div className="h-2 rounded-full bg-panel-raised overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          p.workOrder.status === 'Completed'
                            ? 'bg-emerald-500'
                            : p.isOverdue ? 'bg-rose-500' : 'bg-sky-500'
                        }`}
                        style={{ width: `${Math.min(100, p.completionPercent)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-content-faint mt-1 font-mono">
                      {p.completionPercent}% · {p.remainingQty.toLocaleString()} to go
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-content-dim">{p.runCount}</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-content-dim whitespace-nowrap">
                    {p.workOrder.dueDate}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-bold border whitespace-nowrap ${statusStyle(p)}`}>
                      {p.workOrder.status === 'Completed'
                        ? <CheckCircle2 className="w-3 h-3" />
                        : p.isOverdue
                          ? <AlertTriangle className="w-3 h-3" />
                          : <Clock className="w-3 h-3" />}
                      <span>{p.isOverdue && p.workOrder.status !== 'Completed' ? 'Overdue' : p.workOrder.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
