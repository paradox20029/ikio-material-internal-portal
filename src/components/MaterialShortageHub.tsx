import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Package, 
  Send, 
  Search, 
  Plus, 
  Check, 
  X,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { 
  MaterialShortageItem, 
  ProductionEntry, 
  InventoryComponent, 
  User, 
  ApprovalStatus 
} from '../types';
import { StorageService } from '../services/storage';

interface MaterialShortageHubProps {
  currentUser: User;
  productionEntries: ProductionEntry[];
}

export const MaterialShortageHub: React.FC<MaterialShortageHubProps> = ({
  currentUser,
  productionEntries
}) => {
  const [activeTab, setActiveTab] = useState<'shortages' | 'inventory'>('shortages');
  const [inventory, setInventory] = useState<InventoryComponent[]>(StorageService.getInventory());
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Store Dispatch modal state
  const [dispatchTarget, setDispatchTarget] = useState<{
    entryId: string;
    shortage: MaterialShortageItem;
  } | null>(null);
  const [dispatchRemarks, setDispatchRemarks] = useState<string>('');

  // Collect all shortages with their parent entry
  const allShortages = React.useMemo(() => {
    const list: { shortage: MaterialShortageItem; entry: ProductionEntry }[] = [];
    productionEntries.forEach(entry => {
      entry.shortages.forEach(shortage => {
        list.push({ shortage, entry });
      });
    });
    return list;
  }, [productionEntries]);

  // Filtered shortages
  const filteredShortages = React.useMemo(() => {
    return allShortages.filter(({ shortage, entry }) => {
      if (filterSeverity !== 'ALL' && shortage.severity !== filterSeverity) return false;
      if (filterStatus !== 'ALL' && shortage.status !== filterStatus) return false;
      
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesPart = shortage.partNumber.toLowerCase().includes(q) || shortage.description.toLowerCase().includes(q);
        const matchesLine = entry.productionLine.toLowerCase().includes(q) || entry.subLine.toLowerCase().includes(q);
        const matchesRequester = shortage.requestedBy.toLowerCase().includes(q);
        if (!matchesPart && !matchesLine && !matchesRequester) return false;
      }
      return true;
    });
  }, [allShortages, filterSeverity, filterStatus, searchQuery]);

  // Handle store dispatch execution
  const handleConfirmDispatch = () => {
    if (!dispatchTarget) return;

    StorageService.updateShortageApproval(
      dispatchTarget.entryId,
      dispatchTarget.shortage.id,
      'Dispatched',
      dispatchRemarks || `Material dispatched from store by ${currentUser.name}.`,
      currentUser.name
    );

    // Also deduct from on-hand inventory if part matches
    const matchedInventory = inventory.find(i => i.partNumber === dispatchTarget.shortage.partNumber);
    if (matchedInventory) {
      const updatedStock = Math.max(0, matchedInventory.currentStock - dispatchTarget.shortage.shortageQty);
      const updatedItem = {
        ...matchedInventory,
        currentStock: updatedStock,
        status: (updatedStock <= matchedInventory.safetyStock * 0.5 
          ? 'Critical Shortage' 
          : updatedStock <= matchedInventory.safetyStock 
          ? 'Low Stock' 
          : 'In Stock') as InventoryComponent['status']
      };
      StorageService.updateInventoryItem(updatedItem);
      setInventory(StorageService.getInventory());
    }

    setDispatchTarget(null);
    setDispatchRemarks('');
  };

  const criticalShortageCount = allShortages.filter(s => s.shortage.severity.includes('Critical') && s.shortage.status !== 'Dispatched').length;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-panel border border-panel-line-subtle rounded-2xl p-5 shadow-xl text-content flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Package className="w-4 h-4" />
            <span>Store & Material Shortage Management Hub</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            IKIO Electronics Bill of Materials & Line Shortage Control
          </h1>
          <p className="text-xs text-content-muted mt-0.5">
            Real-time material requisitions from SMT, MI, and FA lines with store buffer dispatch tracking
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-panel-raised/90 p-1.5 rounded-xl border border-panel-line">
          <button
            onClick={() => setActiveTab('shortages')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'shortages'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-content-muted hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Active Shortages ({allShortages.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'inventory'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-content-muted hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>BOM Stock Matrix ({inventory.length})</span>
          </button>
        </div>
      </div>

      {/* Critical Alert Bar if line stops are pending */}
      {criticalShortageCount > 0 && (
        <div className="bg-rose-950/40 border border-rose-800 rounded-2xl p-4 flex items-center justify-between text-rose-200">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
            <div>
              <div className="font-bold text-xs text-rose-300">
                CRITICAL LINE-STOP ALERT: {criticalShortageCount} shortage item(s) threatening active production lines!
              </div>
              <div className="text-[11px] text-rose-300/80 mt-0.5">
                Fast-track store replenishment or vendor buffer PO allocation required immediately.
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setFilterSeverity('Critical (Line Stoppage)');
              setActiveTab('shortages');
            }}
            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
          >
            Filter Critical Only
          </button>
        </div>
      )}

      {/* Tab 1: Shortages List & Requisition Approval */}
      {activeTab === 'shortages' && (
        <div className="space-y-4">
          
          {/* Filter Toolbar */}
          <div className="bg-panel border border-panel-line-subtle rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-content-muted mb-1">Severity</label>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="bg-panel-raised border border-panel-line rounded-xl px-2.5 py-1.5 text-xs text-content-soft"
                >
                  <option value="ALL">All Severities</option>
                  <option value="Critical (Line Stoppage)">Critical (Line Stop)</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-content-muted mb-1">Approval / Store Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-panel-raised border border-panel-line rounded-xl px-2.5 py-1.5 text-xs text-content-soft"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Approved">Approved (Awaiting Dispatch)</option>
                  <option value="Dispatched">Dispatched to Line</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="w-full sm:w-64">
              <label className="block text-[10px] uppercase font-bold text-content-muted mb-1">Search Part / Line</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Part number, line..."
                  className="w-full bg-panel-raised border border-panel-line rounded-xl pl-8 pr-3 py-1.5 text-xs text-content-soft"
                />
                <Search className="w-3.5 h-3.5 text-content-muted absolute left-2.5 top-2" />
              </div>
            </div>
          </div>

          {/* Shortage Cards Table */}
          <div className="glass-table rounded-2xl p-5">
            {filteredShortages.length === 0 ? (
              <div className="text-center py-12 text-content-faint text-xs">
                No material shortages match the active filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-panel-line-subtle text-content-muted font-semibold bg-panel-raised/40">
                      <th className="py-3 px-3">Part No. / Component</th>
                      <th className="py-3 px-3">Line & Sub-Line</th>
                      <th className="py-3 px-3 text-right">Shortage Qty</th>
                      <th className="py-3 px-3">Reason</th>
                      <th className="py-3 px-3 text-center">Severity</th>
                      <th className="py-3 px-3">Requested By / Time</th>
                      <th className="py-3 px-3 text-center">Store / Approval Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-panel-line-subtle/80">
                    {filteredShortages.map(({ shortage, entry }) => (
                      <tr key={shortage.id} className="hover:bg-panel-raised/30 transition">
                        <td className="py-3 px-3">
                          <div className="font-mono font-bold text-sky-400">{shortage.partNumber}</div>
                          <div className="text-[11px] text-content-muted">{shortage.description}</div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-bold text-content-soft">{entry.productionLine} — {entry.subLine}</div>
                          <div className="text-[10px] text-content-muted">{entry.product}</div>
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-amber-300">
                          {shortage.shortageQty.toLocaleString()} <span className="text-[10px] font-normal text-content-muted">{shortage.unit}</span>
                        </td>

                        <td className="py-3 px-3 text-content-dim">
                          <span className="px-2 py-0.5 rounded bg-panel-raised border border-panel-line text-[10px]">
                            {shortage.reason}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            shortage.severity.includes('Critical')
                              ? 'bg-rose-600 text-white animate-pulse'
                              : shortage.severity === 'High'
                              ? 'bg-amber-600 text-white'
                              : 'bg-panel-raised text-content-dim border border-panel-line'
                          }`}>
                            {shortage.severity}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-content-dim">
                          <div className="font-medium text-content-soft">{shortage.requestedBy}</div>
                          <div className="text-[10px] text-content-faint">{shortage.requestedAt}</div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            shortage.status === 'Dispatched'
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                              : shortage.status === 'Approved'
                              ? 'bg-sky-950/80 text-sky-300 border-sky-700/60'
                              : shortage.status === 'Rejected'
                              ? 'bg-rose-950/80 text-rose-300 border-rose-700/60'
                              : 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                          }`}>
                            {shortage.status}
                          </span>
                          {shortage.reviewedBy && (
                            <div className="text-[9px] text-content-faint mt-0.5">by {shortage.reviewedBy}</div>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right">
                          {shortage.status !== 'Dispatched' ? (
                            <button
                              onClick={() => setDispatchTarget({ entryId: entry.id, shortage })}
                              className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold transition flex items-center space-x-1 ml-auto"
                            >
                              <Send className="w-3 h-3" />
                              <span>Dispatch</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-400 font-semibold flex items-center justify-end space-x-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Delivered</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Inventory BOM Matrix */}
      {activeTab === 'inventory' && (
        <div className="bg-panel border border-panel-line-subtle rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-panel-line-subtle pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-content-soft">
                Critical Component Stock & Safety Inventory
              </h2>
              <p className="text-[11px] text-content-muted">
                Current stock balances, rack bins, and safety stock threshold warnings
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {inventory.map((item) => {
              const stockRatio = item.safetyStock > 0 ? (item.currentStock / item.safetyStock) : 1;
              const isCritical = item.status === 'Critical Shortage' || stockRatio < 0.5;
              const isLow = item.status === 'Low Stock' || (stockRatio >= 0.5 && stockRatio < 1);

              return (
                <div 
                  key={item.partNumber}
                  className={`bg-panel-raised/60 border rounded-2xl p-4 flex flex-col justify-between space-y-3 ${
                    isCritical 
                      ? 'border-rose-700/80 bg-rose-950/20' 
                      : isLow 
                      ? 'border-amber-700/60 bg-amber-950/10' 
                      : 'border-panel-line/70'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-sky-400">{item.partNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        isCritical 
                          ? 'bg-rose-600 text-white' 
                          : isLow 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="font-semibold text-xs text-content mt-1">{item.name}</div>
                    <div className="text-[10px] text-content-muted mt-0.5">Loc: {item.location} • {item.supplier}</div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-panel-line/60 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-content-muted">On Hand:</span>
                      <span className="font-bold text-content">{item.currentStock.toLocaleString()} {item.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-content-muted">Safety Min:</span>
                      <span className="text-content-dim">{item.safetyStock.toLocaleString()} {item.unit}</span>
                    </div>
                    
                    {/* Stock Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-panel-high overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          isCritical ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, stockRatio * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dispatch Modal */}
      {dispatchTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-panel-deep/80 backdrop-blur-sm p-4">
          <div className="bg-panel border border-sky-500 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-content">
            <div className="flex items-center justify-between border-b border-panel-line-subtle pb-3">
              <div className="flex items-center space-x-2 text-sky-400 font-bold text-sm">
                <Send className="w-4 h-4" />
                <span>Confirm Material Issue & Dispatch</span>
              </div>
              <button
                onClick={() => setDispatchTarget(null)}
                className="text-content-muted hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="bg-panel-raised p-3 rounded-xl border border-panel-line text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-content-muted">Component:</span>
                <span className="font-mono font-bold text-sky-400">{dispatchTarget.shortage.partNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-content-muted">Dispatch Qty:</span>
                <span className="font-mono font-bold text-amber-300">{dispatchTarget.shortage.shortageQty} {dispatchTarget.shortage.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-content-muted">Target Line:</span>
                <span className="font-bold text-content-soft">Requisition for floor</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-content-dim mb-1">Store Dispatch Remarks</label>
              <input
                type="text"
                value={dispatchRemarks}
                onChange={(e) => setDispatchRemarks(e.target.value)}
                placeholder="e.g. Issued from Bay SMT-A-04. Delivered to operator by store runner."
                className="w-full bg-panel-raised border border-panel-line rounded-xl px-3 py-2 text-xs text-content"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDispatchTarget(null)}
                className="px-4 py-2 rounded-xl bg-panel-raised hover:bg-panel-high text-content-dim text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDispatch}
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow"
              >
                Confirm Dispatch to Line
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
