import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Layers, 
  Filter, 
  RotateCcw,
  CheckCheck,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Box,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  ProductionEntry, 
  User, 
  ProductionLine, 
  ShiftType, 
  ApprovalStatus 
} from '../types';
import { StorageService } from '../services/storage';

interface AdminDashboardProps {
  currentUser: User;
  productionEntries: ProductionEntry[];
  onOpenStaffManager: () => void;
  onNavigateToEntry: () => void;
}

const LINE_COLORS: Record<string, string> = {
  'SMT': '#38bdf8',
  'MI': '#818cf8',
  'MI-Finishing': '#a78bfa',
  'FA-Lum': '#34d399',
  'FA-Ref': '#fbbf24'
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  productionEntries,
  onOpenStaffManager,
  onNavigateToEntry
}) => {
  // Filter states
  const [selectedDate, setSelectedDate] = useState<string>('ALL');
  const [selectedShift, setSelectedShift] = useState<string>('ALL');
  const [selectedLine, setSelectedLine] = useState<string>('ALL');
  const [selectedSubLine, setSelectedSubLine] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Approval modal / remarks state
  const [activeApprovalEntry, setActiveApprovalEntry] = useState<ProductionEntry | null>(null);
  const [adminRemarks, setAdminRemarks] = useState<string>('');
  const [approvalAction, setApprovalAction] = useState<'Approved' | 'Rejected'>('Approved');

  // Shortage quick approval state
  const [activeShortageApproval, setActiveShortageApproval] = useState<{
    entryId: string;
    shortageId: string;
    partNumber: string;
    shortageQty: number;
    unit: string;
  } | null>(null);
  const [shortageRemarks, setShortageRemarks] = useState<string>('');

  // Extract unique filter options from data
  const uniqueDates = useMemo(() => {
    const set = new Set(productionEntries.map(e => e.date));
    return Array.from(set).sort().reverse();
  }, [productionEntries]);

  const uniqueSubLines = useMemo(() => {
    if (selectedLine === 'ALL') {
      const set = new Set(productionEntries.map(e => e.subLine));
      return Array.from(set);
    }
    const filtered = productionEntries.filter(e => e.productionLine === selectedLine);
    const set = new Set(filtered.map(e => e.subLine));
    return Array.from(set);
  }, [productionEntries, selectedLine]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return productionEntries.filter(entry => {
      if (selectedDate !== 'ALL' && entry.date !== selectedDate) return false;
      if (selectedShift !== 'ALL' && entry.shift !== selectedShift) return false;
      if (selectedLine !== 'ALL' && entry.productionLine !== selectedLine) return false;
      if (selectedSubLine !== 'ALL' && entry.subLine !== selectedSubLine) return false;
      if (selectedStatus !== 'ALL' && entry.adminApprovalStatus !== selectedStatus) return false;
      
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesProduct = entry.product.toLowerCase().includes(q) || entry.productCode.toLowerCase().includes(q);
        const matchesStaff = entry.enteredByName.toLowerCase().includes(q);
        const matchesSubLine = entry.subLine.toLowerCase().includes(q);
        if (!matchesProduct && !matchesStaff && !matchesSubLine) return false;
      }
      
      return true;
    });
  }, [productionEntries, selectedDate, selectedShift, selectedLine, selectedSubLine, selectedStatus, searchQuery]);

  // Compute Live Executive KPIs
  const totalPlanned = useMemo(() => filteredEntries.reduce((acc, e) => acc + e.plan, 0), [filteredEntries]);
  const totalAchieved = useMemo(() => filteredEntries.reduce((acc, e) => acc + e.achieved, 0), [filteredEntries]);
  const overallEfficiency = totalPlanned > 0 ? Number(((totalAchieved / totalPlanned) * 100).toFixed(1)) : 0;
  
  const totalManpower = useMemo(() => filteredEntries.reduce((acc, e) => acc + e.manpowerUsed, 0), [filteredEntries]);
  const totalRejections = useMemo(() => filteredEntries.reduce((acc, e) => acc + (e.rejectionQty || 0), 0), [filteredEntries]);
  
  const pendingApprovals = useMemo(() => {
    return productionEntries.filter(e => e.adminApprovalStatus === 'Pending Approval');
  }, [productionEntries]);

  const activeShortages = useMemo(() => {
    const list: { shortage: ProductionEntry['shortages'][0]; entry: ProductionEntry }[] = [];
    productionEntries.forEach(entry => {
      entry.shortages.forEach(sh => {
        if (sh.status === 'Pending Approval') {
          list.push({ shortage: sh, entry });
        }
      });
    });
    return list;
  }, [productionEntries]);

  // Chart data: Output by Line
  const lineChartData = useMemo(() => {
    const lines: ProductionLine[] = ['SMT', 'MI', 'MI-Finishing', 'FA-Lum', 'FA-Ref'];
    return lines.map(line => {
      const lineEntries = filteredEntries.filter(e => e.productionLine === line);
      const plan = lineEntries.reduce((sum, e) => sum + e.plan, 0);
      const achieved = lineEntries.reduce((sum, e) => sum + e.achieved, 0);
      const eff = plan > 0 ? Number(((achieved / plan) * 100).toFixed(1)) : 0;
      return {
        line,
        Plan: plan,
        Achieved: achieved,
        Efficiency: eff
      };
    });
  }, [filteredEntries]);

  // Chart data: Shift Distribution
  const shiftChartData = useMemo(() => {
    const shifts: ShiftType[] = ['Shift 1', 'Shift 2', 'Shift 3'];
    const colors = ['#38bdf8', '#818cf8', '#34d399'];
    return shifts.map((s, idx) => {
      const count = filteredEntries.filter(e => e.shift === s).reduce((acc, e) => acc + e.achieved, 0);
      return {
        name: s,
        value: count,
        color: colors[idx]
      };
    }).filter(d => d.value > 0);
  }, [filteredEntries]);

  // Handle entry approval
  const handleApproveEntry = () => {
    if (!activeApprovalEntry) return;
    StorageService.approveProductionEntry(
      activeApprovalEntry.id,
      adminRemarks,
      currentUser.name,
      approvalAction
    );
    setActiveApprovalEntry(null);
    setAdminRemarks('');
  };

  // Handle individual shortage approval
  const handleApproveShortage = (status: ApprovalStatus) => {
    if (!activeShortageApproval) return;
    StorageService.updateShortageApproval(
      activeShortageApproval.entryId,
      activeShortageApproval.shortageId,
      status,
      shortageRemarks || `Admin ${status} store requisition.`,
      currentUser.name
    );
    setActiveShortageApproval(null);
    setShortageRemarks('');
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Entry ID', 'Date', 'Shift', 'Line', 'Sub Line', 'Work Order', 'Product', 'Plan', 'Achieved', 'Efficiency %', 'Manpower', 'Working Hrs', 'Shortages', 'Entered By', 'Role', 'Approval Status'];
    const rows = filteredEntries.map(e => [
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
      e.manpowerUsed,
      e.totalWorkingHrs,
      e.shortages.length,
      `"${e.enteredByName}"`,
      `"${e.enteredByRole || ''}"`,
      e.adminApprovalStatus
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `IKIO_EMS_Production_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Top Welcome & Quick Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Centralized Administrator Operations Hub</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            IKIO Plant Live Production & Material Approvals
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time synchronization active • {productionEntries.length} total runs logged • {pendingApprovals.length} runs pending approval
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-admin-add-staff"
            onClick={onOpenStaffManager}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>Staff & Roles</span>
          </button>

          <button
            id="btn-admin-export-csv"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            id="btn-admin-quick-entry"
            onClick={onNavigateToEntry}
            className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-sky-500/20 transition cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>New Line Entry</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* KPI 1: Target Plan */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Total Plan</span>
            <Box className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-xl font-black font-mono text-slate-100 mt-2">
            {totalPlanned.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Target Units</div>
        </div>

        {/* KPI 2: Achieved Output */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Achieved Output</span>
            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-black font-mono text-emerald-400 mt-2">
            {totalAchieved.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Actual Units Made</div>
        </div>

        {/* KPI 3: Plant Efficiency Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Efficiency</span>
            <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className={`text-xl font-black font-mono mt-2 ${
            overallEfficiency >= 90 ? 'text-emerald-400' : overallEfficiency >= 80 ? 'text-amber-400' : 'text-rose-400'
          }`}>
            {overallEfficiency}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Plantwide Average</div>
        </div>

        {/* KPI 4: Pending Approvals */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md relative overflow-hidden">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Pending Approvals</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-black font-mono text-amber-400 mt-2">
            {pendingApprovals.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Runs Awaiting Signoff</div>
        </div>

        {/* KPI 5: Active Shortages */}
        <div className={`border rounded-2xl p-4 shadow-md ${
          activeShortages.length > 0 ? 'bg-rose-950/20 border-rose-800/60' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Shortages Pending</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-black font-mono text-rose-400 mt-2">
            {activeShortages.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Critical Material Requests</div>
        </div>

        {/* KPI 6: Total Floor Manpower */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Floor Manpower</span>
            <Users className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-black font-mono text-indigo-300 mt-2">
            {totalManpower}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Operators Deployed</div>
        </div>

      </div>

      {/* Pending Material Shortages & Critical Alerts Queue (High Priority) */}
      {activeShortages.length > 0 && (
        <div className="bg-rose-950/30 border border-rose-800/80 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3 border-b border-rose-800/50 pb-2.5">
            <div className="flex items-center space-x-2 text-rose-300 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>URGENT: Material Shortages & Store Requisitions Requiring Admin Approval ({activeShortages.length})</span>
            </div>
            <span className="text-[11px] text-rose-400/80 font-medium">Real-Time Floor Requests</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeShortages.map(({ shortage, entry }) => (
              <div 
                key={shortage.id}
                className="bg-slate-900/90 border border-rose-700/60 rounded-xl p-3.5 flex flex-col justify-between text-xs space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sky-400 text-xs px-2 py-0.5 rounded bg-sky-950 border border-sky-800">
                      {shortage.partNumber}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      shortage.severity.includes('Critical') ? 'bg-rose-600 text-white' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {shortage.severity}
                    </span>
                  </div>

                  <div className="mt-2 text-slate-200">
                    <span className="font-semibold text-rose-300">Shortage: {shortage.shortageQty} {shortage.unit}</span>
                    <span className="text-slate-400 ml-1">({shortage.reason})</span>
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Line: <strong className="text-slate-200">{entry.productionLine} ({entry.subLine})</strong> • Product: {entry.product}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Requested by {shortage.requestedBy} at {shortage.requestedAt}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => setActiveShortageApproval({
                      entryId: entry.id,
                      shortageId: shortage.id,
                      partNumber: shortage.partNumber,
                      shortageQty: shortage.shortageQty,
                      unit: shortage.unit
                    })}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve / Dispatch</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cascading Filter Bar (Drop-Down Selection) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Filter className="w-4 h-4 text-sky-400" />
            <span>Cascading Filter Bar — View Data Accordingly</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setSelectedDate('ALL');
                setSelectedShift('ALL');
                setSelectedLine('ALL');
                setSelectedSubLine('ALL');
                setSelectedStatus('ALL');
                setSearchQuery('');
              }}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          
          {/* Filter 1: Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Date</label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
            >
              <option value="ALL">All Dates</option>
              {uniqueDates.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Filter 2: Shift */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Shift</label>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="ALL">All Shifts</option>
              <option value="Shift 1">Shift 1</option>
              <option value="Shift 2">Shift 2</option>
              <option value="Shift 3">Shift 3 (Night)</option>
            </select>
          </div>

          {/* Filter 3: Production Line */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Production Line</label>
            <select
              value={selectedLine}
              onChange={(e) => {
                setSelectedLine(e.target.value);
                setSelectedSubLine('ALL');
              }}
              className="w-full bg-slate-800 border border-sky-500/50 rounded-xl px-2.5 py-2 text-xs text-sky-300 font-bold focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="ALL">All Lines (SMT/MI/FA)</option>
              <option value="SMT">SMT</option>
              <option value="MI">MI</option>
              <option value="MI-Finishing">MI-Finishing</option>
              <option value="FA-Lum">FA- Lum</option>
              <option value="FA-Ref">FA- Ref</option>
            </select>
          </div>

          {/* Filter 4: Sub Line (Cascading) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Sub Line</label>
            <select
              value={selectedSubLine}
              onChange={(e) => setSelectedSubLine(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="ALL">All Sub Lines</option>
              {uniqueSubLines.map(sl => (
                <option key={sl} value={sl}>{sl}</option>
              ))}
            </select>
          </div>

          {/* Filter 5: Approval Status */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Approval Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Filter 6: Search Input */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Search Product/Staff</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

        </div>
      </div>

      {/* Production Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Plan vs Achieved by Line (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Plan vs. Achieved Output by Production Line
              </h2>
              <p className="text-[11px] text-slate-500">Filtered view performance across SMT, MI & Final Assembly</p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1.5 text-slate-400">
                <span className="w-3 h-3 rounded bg-slate-600" />
                <span>Plan</span>
              </span>
              <span className="flex items-center space-x-1.5 text-sky-400 font-semibold">
                <span className="w-3 h-3 rounded bg-sky-500" />
                <span>Achieved</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="line" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Bar dataKey="Plan" fill="#475569" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Achieved" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Output Distribution by Shift */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Output by Shift
            </h2>
            <p className="text-[11px] text-slate-500">Total units manufactured per shift</p>
          </div>

          <div className="h-48 w-full my-auto">
            {shiftChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={shiftChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {shiftChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                No shift data available for current filter
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-center">
            {shiftChartData.map((s) => (
              <div key={s.name} className="p-1 rounded bg-slate-800/60">
                <div className="text-[10px] text-slate-400">{s.name}</div>
                <div className="text-xs font-bold font-mono text-slate-100">{s.value.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Filtered Production Runs & Administrator Approval Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>Production Line Records & Approval Queue ({filteredEntries.length})</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live floor entries. Click "Review / Approve" on any pending run to sign off or request rework.
            </p>
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No production runs match the selected dropdown filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-800/40">
                  <th className="py-2.5 px-3">Date / Shift</th>
                  <th className="py-2.5 px-3">Line & Sub Line</th>
                  <th className="py-2.5 px-3">Work Order</th>
                  <th className="py-2.5 px-3">Product / Code</th>
                  <th className="py-2.5 px-3 text-right">Plan</th>
                  <th className="py-2.5 px-3 text-right">Achieved</th>
                  <th className="py-2.5 px-3 text-center">Efficiency</th>
                  <th className="py-2.5 px-3 text-center">Manpower</th>
                  <th className="py-2.5 px-3 text-center">Shortages</th>
                  <th className="py-2.5 px-3">Entered By</th>
                  <th className="py-2.5 px-3 text-center">Approval Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredEntries.map((entry) => (
                  <tr 
                    key={entry.id}
                    className="hover:bg-slate-800/40 transition group"
                  >
                    <td className="py-3 px-3 font-mono">
                      <div className="text-slate-200 font-medium">{entry.date}</div>
                      <div className="text-[10px] text-sky-400 font-semibold">{entry.shift}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-1.5">
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-800 border border-slate-700 text-sky-300">
                          {entry.productionLine}
                        </span>
                        <span className="font-semibold text-slate-200">{entry.subLine}</span>
                      </div>
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
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60' 
                          : entry.efficiencyPercent >= 80 
                          ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60' 
                          : 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                      }`}>
                        {entry.efficiencyPercent}%
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-slate-300">
                      <div>{entry.manpowerUsed} ops</div>
                      <div className="text-[10px] text-slate-500">{entry.totalWorkingHrs}h ({entry.unitsPerManHour} u/h)</div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      {entry.shortages.length > 0 ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          <span>{entry.shortages.length} item(s)</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">None</span>
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
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        entry.adminApprovalStatus === 'Approved'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                          : entry.adminApprovalStatus === 'Rejected'
                          ? 'bg-rose-950/80 text-rose-300 border-rose-700/60'
                          : 'bg-amber-950/80 text-amber-300 border-amber-700/60 animate-pulse'
                      }`}>
                        {entry.adminApprovalStatus}
                      </span>
                      {entry.adminApprovedBy && (
                        <div className="text-[9px] text-slate-500 mt-0.5">by {entry.adminApprovedBy}</div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          setActiveApprovalEntry(entry);
                          setAdminRemarks(entry.adminApprovalNotes || '');
                          setApprovalAction(entry.adminApprovalStatus === 'Rejected' ? 'Rejected' : 'Approved');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/50 text-[11px] font-bold transition"
                      >
                        Review / Signoff
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Production Run Approval Review */}
      {activeApprovalEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm text-white">Administrator Approval Review</h3>
              </div>
              <button
                onClick={() => setActiveApprovalEntry(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Line & Sub-Line:</span>
                <span className="font-bold text-sky-300">{activeApprovalEntry.productionLine} — {activeApprovalEntry.subLine}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Product:</span>
                <span className="font-semibold text-slate-200">{activeApprovalEntry.product}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Plan vs Achieved:</span>
                <span className="font-mono font-bold text-emerald-400">{activeApprovalEntry.achieved} / {activeApprovalEntry.plan} ({activeApprovalEntry.efficiencyPercent}%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Submitted by:</span>
                <span className="text-slate-200">{activeApprovalEntry.enteredByName} on {activeApprovalEntry.date} ({activeApprovalEntry.shift})</span>
              </div>
              {activeApprovalEntry.supervisorNotes && (
                <div className="pt-2 border-t border-slate-700/60 text-[11px] text-slate-300">
                  <strong className="text-slate-400">Supervisor Remarks:</strong> "{activeApprovalEntry.supervisorNotes}"
                </div>
              )}
            </div>

            {/* Shortages attached */}
            {activeApprovalEntry.shortages.length > 0 && (
              <div className="bg-rose-950/30 border border-rose-800/60 rounded-xl p-3 text-xs space-y-2">
                <div className="text-rose-300 font-bold flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Reported Shortages ({activeApprovalEntry.shortages.length}):</span>
                </div>
                {activeApprovalEntry.shortages.map(sh => (
                  <div key={sh.id} className="text-[11px] text-slate-200 flex justify-between">
                    <span>{sh.partNumber} ({sh.shortageQty} {sh.unit})</span>
                    <span className="text-amber-400 font-medium">{sh.status}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Admin Decision Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Administrator Decision</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setApprovalAction('Approved')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 border transition ${
                    approvalAction === 'Approved'
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Approve Run</span>
                </button>

                <button
                  type="button"
                  onClick={() => setApprovalAction('Rejected')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 border transition ${
                    approvalAction === 'Rejected'
                      ? 'bg-rose-600 border-rose-500 text-white shadow-lg'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <XCircle className="w-4 h-4 text-rose-200" />
                  <span>Reject / Require Fix</span>
                </button>
              </div>
            </div>

            {/* Admin Remarks */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Approval Remarks / Instructions</label>
              <textarea
                rows={2}
                value={adminRemarks}
                onChange={(e) => setAdminRemarks(e.target.value)}
                placeholder="e.g. Yield approved. Rework batch cleared by QA. Store buffer dispatched."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveApprovalEntry(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveEntry}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow"
              >
                Confirm Signoff
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Shortage Store Approval */}
      {activeShortageApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-rose-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-rose-300 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <span>Store Requisition Approval</span>
              </div>
              <button
                onClick={() => setActiveShortageApproval(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Part Number:</span>
                <span className="font-mono font-bold text-sky-400">{activeShortageApproval.partNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Quantity Required:</span>
                <span className="font-mono font-bold text-amber-300">{activeShortageApproval.shortageQty} {activeShortageApproval.unit}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Dispatch Notes / Remarks</label>
              <input
                type="text"
                value={shortageRemarks}
                onChange={(e) => setShortageRemarks(e.target.value)}
                placeholder="e.g. Issue 250 pcs from Store Rack SMT-A-04 immediately."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleApproveShortage('Approved')}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                Approve Requisition
              </button>
              <button
                type="button"
                onClick={() => handleApproveShortage('Rejected')}
                className="py-2.5 px-3 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
