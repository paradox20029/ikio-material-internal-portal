import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Users,
  RotateCcw
} from 'lucide-react';
import { ProductionEntry, ProductionLine, ShiftType } from '../types';

interface ProductionDataTableProps {
  entries: ProductionEntry[];
  onSelectEntry?: (entry: ProductionEntry) => void;
}

export const ProductionDataTable: React.FC<ProductionDataTableProps> = ({
  entries,
  onSelectEntry
}) => {
  const [selectedLine, setSelectedLine] = useState<string>('ALL');
  const [selectedShift, setSelectedShift] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectedEntry, setInspectedEntry] = useState<ProductionEntry | null>(null);

  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (selectedLine !== 'ALL' && e.productionLine !== selectedLine) return false;
      if (selectedShift !== 'ALL' && e.shift !== selectedShift) return false;
      
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchProd = e.product.toLowerCase().includes(q) || e.productCode.toLowerCase().includes(q);
        const matchStaff = e.enteredByName.toLowerCase().includes(q);
        const matchSub = e.subLine.toLowerCase().includes(q);
        if (!matchProd && !matchStaff && !matchSub) return false;
      }
      return true;
    });
  }, [entries, selectedLine, selectedShift, searchQuery]);

  const handleExportCSV = () => {
    const headers = ['Record ID', 'Date', 'Shift', 'Line', 'Sub Line', 'Work Order', 'Product', 'Plan', 'Achieved', 'Efficiency %', 'Variance', 'Manpower', 'Working Hrs', 'Units/Man-Hr', 'Rejections', 'Status', 'Entered By', 'Role'];
    const rows = filtered.map(e => [
      e.id,
      e.date,
      e.shift,
      e.productionLine,
      e.subLine,
      e.workOrderNumber || '',
      `"${e.product}"`,
      e.plan,
      e.achieved,
      `${e.efficiencyPercent}%`,
      e.variance,
      e.manpowerUsed,
      e.totalWorkingHrs,
      e.unitsPerManHour,
      e.rejectionQty || 0,
      e.adminApprovalStatus,
      `"${e.enteredByName}"`,
      `"${e.enteredByRole || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `IKIO_Production_Matrix_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Master Production Run Matrix</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Complete Production & Rejection Log History
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit trail of all floor submissions with detailed metrics, supervisor notes, and QA variance
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center space-x-2 transition self-start md:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Master CSV</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Production Line</label>
            <select
              value={selectedLine}
              onChange={(e) => setSelectedLine(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="ALL">All Lines</option>
              <option value="SMT">SMT</option>
              <option value="MI">MI</option>
              <option value="MI-Finishing">MI-Finishing</option>
              <option value="FA-Lum">FA- Lum</option>
              <option value="FA-Ref">FA- Ref</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Shift</label>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="ALL">All Shifts</option>
              <option value="Shift 1">Shift 1</option>
              <option value="Shift 2">Shift 2</option>
              <option value="Shift 3">Shift 3</option>
            </select>
          </div>

          {(selectedLine !== 'ALL' || selectedShift !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedLine('ALL');
                setSelectedShift('ALL');
                setSearchQuery('');
              }}
              className="mt-4 text-xs text-slate-400 hover:text-white flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>

        <div className="w-full sm:w-64">
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Search Product / Operator</label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product code, operator..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-800/40">
                <th className="py-3 px-3">Date & Shift</th>
                <th className="py-3 px-3">Line / Sub-Line</th>
                <th className="py-3 px-3">Work Order</th>
                <th className="py-3 px-3">Product Model</th>
                <th className="py-3 px-3 text-right">Plan</th>
                <th className="py-3 px-3 text-right">Achieved</th>
                <th className="py-3 px-3 text-center">Efficiency</th>
                <th className="py-3 px-3 text-center">Variance</th>
                <th className="py-3 px-3 text-center">Manpower</th>
                <th className="py-3 px-3 text-center">Rejections</th>
                <th className="py-3 px-3">Entered By</th>
                <th className="py-3 px-3 text-center">Approval</th>
                <th className="py-3 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-mono">
                    <div className="text-slate-200 font-semibold">{entry.date}</div>
                    <div className="text-[10px] text-sky-400 font-bold">{entry.shift}</div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-200">{entry.productionLine}</div>
                    <div className="text-[10px] text-slate-400">{entry.subLine}</div>
                  </td>

                  {/* Work Order */}
                  <td className="py-3 px-3">
                    <span className="inline-block px-2 py-1 rounded-md font-mono text-[11px] font-bold whitespace-nowrap bg-sky-950/70 text-sky-300 border border-sky-800/70">
                      {entry.workOrderNumber || '—'}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-200">{entry.product}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{entry.productCode}</div>
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    {entry.plan.toLocaleString()}
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                    {entry.achieved.toLocaleString()}
                  </td>

                  <td className="py-3 px-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                      entry.efficiencyPercent >= 90
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                        : entry.efficiencyPercent >= 80
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                        : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                    }`}>
                      {entry.efficiencyPercent}%
                    </span>
                  </td>

                  <td className="py-3 px-3 text-center font-mono font-bold">
                    <span className={entry.variance >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {entry.variance > 0 ? `+${entry.variance}` : entry.variance}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-center font-mono text-slate-300">
                    {entry.manpowerUsed} ops ({entry.unitsPerManHour} u/h)
                  </td>

                  <td className="py-3 px-3 text-center font-mono">
                    {entry.rejectionQty ? (
                      <span className="text-rose-400 font-bold">{entry.rejectionQty}</span>
                    ) : (
                      <span className="text-slate-500">0</span>
                    )}
                  </td>

                  {/* Entered By — role shown directly under the name */}
                  <td className="py-3 px-3">
                    <div className="text-slate-200 font-medium">{entry.enteredByName}</div>
                    <div className="mt-0.5">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-950/70 text-indigo-300 border border-indigo-800/60">
                        {entry.enteredByRole || 'Data Entry Staff'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{entry.enteredAt}</div>
                  </td>

                  <td className="py-3 px-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                      entry.adminApprovalStatus === 'Approved'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                        : entry.adminApprovalStatus === 'Rejected'
                        ? 'bg-rose-950/80 text-rose-300 border-rose-700/60'
                        : 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                    }`}>
                      {entry.adminApprovalStatus}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => setInspectedEntry(entry)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      title="Inspect full run details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Inspector Modal */}
      {inspectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-white">Production Run #{inspectedEntry.id}</h3>
                <p className="text-[11px] text-slate-400">{inspectedEntry.productionLine} — {inspectedEntry.subLine} ({inspectedEntry.date} {inspectedEntry.shift})</p>
              </div>
              <button
                onClick={() => setInspectedEntry(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60 font-mono text-xs">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Plan</div>
                <div className="text-sm font-bold text-slate-200">{inspectedEntry.plan}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Achieved</div>
                <div className="text-sm font-bold text-emerald-400">{inspectedEntry.achieved}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Efficiency</div>
                <div className="text-sm font-bold text-sky-400">{inspectedEntry.efficiencyPercent}%</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Productivity</div>
                <div className="text-sm font-bold text-indigo-300">{inspectedEntry.unitsPerManHour} u/h</div>
              </div>
            </div>

            {inspectedEntry.shortages.length > 0 && (
              <div className="bg-rose-950/30 border border-rose-800/60 rounded-xl p-3 text-xs space-y-2">
                <div className="font-bold text-rose-300 flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Reported Shortages ({inspectedEntry.shortages.length})</span>
                </div>
                {inspectedEntry.shortages.map(sh => (
                  <div key={sh.id} className="text-[11px] text-slate-200 flex justify-between border-b border-rose-900/40 pb-1">
                    <span>{sh.partNumber} — {sh.shortageQty} {sh.unit} ({sh.reason})</span>
                    <span className="font-bold text-amber-400">{sh.status}</span>
                  </div>
                ))}
              </div>
            )}

            {inspectedEntry.supervisorNotes && (
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 text-xs">
                <div className="font-bold text-slate-300 mb-0.5">Supervisor Notes</div>
                <p className="text-slate-300 text-[11px] italic">"{inspectedEntry.supervisorNotes}"</p>
              </div>
            )}

            {inspectedEntry.adminApprovalNotes && (
              <div className="bg-indigo-950/30 p-3 rounded-xl border border-indigo-800/50 text-xs">
                <div className="font-bold text-indigo-300 mb-0.5">Administrator Approval Remarks</div>
                <p className="text-indigo-200 text-[11px]">"{inspectedEntry.adminApprovalNotes}"</p>
                <div className="text-[10px] text-slate-400 mt-1">Signed off by {inspectedEntry.adminApprovedBy} ({inspectedEntry.adminApprovedAt})</div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setInspectedEntry(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
