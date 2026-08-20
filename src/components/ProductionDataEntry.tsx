import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Clock, 
  Zap, 
  Info,
  Layers,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  ProductionLine, 
  ShiftType, 
  User, 
  MaterialShortageItem, 
  ShortageSeverity 
} from '../types';
import { LINE_CONFIGURATIONS } from '../data/initialData';
import { StorageService } from '../services/storage';

interface ProductionDataEntryProps {
  currentUser: User;
  onEntrySuccess?: () => void;
  onNavigateToDashboard?: () => void;
}

export const ProductionDataEntry: React.FC<ProductionDataEntryProps> = ({
  currentUser,
  onEntrySuccess,
  onNavigateToDashboard
}) => {
  // Input fields from user specification
  const [date, setDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  const [shift, setShift] = useState<ShiftType>('Shift 1');
  const [productionLine, setProductionLine] = useState<ProductionLine>('SMT');
  const [subLine, setSubLine] = useState<string>('Line 1');
  const [productName, setProductName] = useState<string>('');
  const [productCode, setProductCode] = useState<string>('');
  
  const [plan, setPlan] = useState<number | ''>(1200);
  const [achieved, setAchieved] = useState<number | ''>(1150);
  const [manpowerUsed, setManpowerUsed] = useState<number | ''>(6);
  const [totalWorkingHrs, setTotalWorkingHrs] = useState<number | ''>(8.0);
  
  // Rejection / QA notes
  const [rejectionQty, setRejectionQty] = useState<number | ''>(12);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [supervisorNotes, setSupervisorNotes] = useState<string>('');

  // Material Shortages list
  const [shortages, setShortages] = useState<MaterialShortageItem[]>([]);
  const [showShortageForm, setShowShortageForm] = useState<boolean>(false);
  
  // Shortage temporary state
  const [shortagePart, setShortagePart] = useState<string>('');
  const [shortageDesc, setShortageDesc] = useState<string>('');
  const [shortageQty, setShortageQty] = useState<number | ''>('');
  const [shortageUnit, setShortageUnit] = useState<string>('pcs');
  const [shortageReason, setShortageReason] = useState<MaterialShortageItem['reason']>('Defective Batch');
  const [shortageSeverity, setShortageSeverity] = useState<ShortageSeverity>('Medium');
  const [lineStopRisk, setLineStopRisk] = useState<boolean>(false);

  // Status message
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedBanner, setSubmittedBanner] = useState<string | null>(null);

  // Available sub-lines and products for current line configuration
  const currentLineConfig = LINE_CONFIGURATIONS[productionLine];
  const availableSubLines = currentLineConfig?.subLines || ['Line 1', 'Line 2'];
  const availableProducts = currentLineConfig?.defaultProducts || [];

  // When Production Line changes, reset sub-line and product to valid filtered values
  useEffect(() => {
    if (availableSubLines.length > 0) {
      setSubLine(availableSubLines[0]);
    }
    if (availableProducts.length > 0) {
      setProductName(availableProducts[0].name);
      setProductCode(availableProducts[0].code);
      setManpowerUsed(availableProducts[0].standardManpower);
      setPlan(availableProducts[0].targetPerHour * 8);
    }
  }, [productionLine]);

  // When product dropdown changes
  const handleProductChange = (name: string) => {
    const matched = availableProducts.find(p => p.name === name);
    if (matched) {
      setProductName(matched.name);
      setProductCode(matched.code);
      setManpowerUsed(matched.standardManpower);
      setPlan(matched.targetPerHour * (typeof totalWorkingHrs === 'number' ? totalWorkingHrs : 8));
    } else {
      setProductName(name);
    }
  };

  // Calculations
  const numericPlan = typeof plan === 'number' ? plan : 0;
  const numericAchieved = typeof achieved === 'number' ? achieved : 0;
  const numericManpower = typeof manpowerUsed === 'number' ? manpowerUsed : 0;
  const numericHrs = typeof totalWorkingHrs === 'number' ? totalWorkingHrs : 0;
  const numericRejections = typeof rejectionQty === 'number' ? rejectionQty : 0;

  const efficiencyPercent = numericPlan > 0 
    ? Number(((numericAchieved / numericPlan) * 100).toFixed(1)) 
    : 0;

  const variance = numericAchieved - numericPlan;
  const totalManHours = numericManpower * numericHrs;
  const unitsPerManHour = totalManHours > 0 
    ? Number((numericAchieved / totalManHours).toFixed(2)) 
    : 0;

  // Add Shortage to the list
  const handleAddShortage = () => {
    if (!shortagePart || !shortageQty || Number(shortageQty) <= 0) {
      alert('Please specify a valid component part number and shortage quantity.');
      return;
    }

    const newShortage: MaterialShortageItem = {
      id: `shrt-new-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      partNumber: shortagePart.toUpperCase().trim(),
      description: shortageDesc || `${shortagePart} Required for ${productionLine}`,
      category: 'Passives',
      requiredQty: Number(shortageQty) + numericAchieved,
      shortageQty: Number(shortageQty),
      unit: shortageUnit,
      reason: shortageReason,
      severity: shortageSeverity,
      status: 'Pending Approval',
      requestedBy: currentUser.name,
      requestedAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      lineStoppageRisk: lineStopRisk || shortageSeverity.includes('Critical')
    };

    setShortages([...shortages, newShortage]);
    
    // Reset form
    setShortagePart('');
    setShortageDesc('');
    setShortageQty('');
    setShowShortageForm(false);
  };

  const handleRemoveShortage = (id: string) => {
    setShortages(shortages.filter(s => s.id !== id));
  };

  // Submit full production and material run
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (numericPlan <= 0 || numericAchieved < 0) {
      alert('Please provide valid target plan and achieved production quantities.');
      return;
    }

    setIsSubmitting(true);

    try {
      const newEntry = StorageService.addProductionEntry({
        date,
        shift,
        productionLine,
        subLine,
        product: productName,
        productCode: productCode || 'IK-PROD-GENERIC',
        plan: numericPlan,
        achieved: numericAchieved,
        manpowerUsed: numericManpower,
        totalWorkingHrs: numericHrs,
        rejectionQty: numericRejections,
        rejectionReason: rejectionReason || undefined,
        shortages,
        enteredBy: currentUser.id,
        enteredByName: currentUser.name,
        enteredByRole: currentUser.role,
        enteredAt: new Date().toLocaleString(),
        status: shortages.length > 0 ? 'Action Required' : 'Submitted',
        supervisorNotes: supervisorNotes || undefined
      });

      // Celebration confetti for good efficiency runs
      if (efficiencyPercent >= 90) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      }

      setSubmittedBanner(`Successfully logged entry #${newEntry.id}. Real-time update dispatched to Administrator Dashboard.`);
      
      // Reset some fields for next entry
      setShortages([]);
      setSupervisorNotes('');
      setRejectionReason('');

      if (onEntrySuccess) {
        onEntrySuccess();
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting production data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6">
      
      {/* Header Banner */}
      <div className="mb-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Layers className="w-4 h-4" />
              <span>IKIO Manufacturing Execution Screen</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              Production & Material Data Entry
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Select production line, sub-line, and product from dropdown menus. Enter plan vs achieved metrics and log any material shortages for real-time administrator review.
            </p>
          </div>

          <div className="flex items-center space-x-3 self-start sm:self-auto bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/80">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Logged In As</div>
              <div className="text-xs font-bold text-slate-200">{currentUser.name}</div>
              <div className="text-[11px] text-sky-400 font-medium">{currentUser.role}</div>
            </div>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs ${currentUser.avatarColor}`}>
              {currentUser.name.charAt(0)}
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {submittedBanner && (
        <div className="mb-6 bg-emerald-950/80 border border-emerald-700/60 rounded-xl p-4 text-emerald-200 flex items-start justify-between shadow-lg">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-bold text-emerald-300">Run Logged & Broadcasted</div>
              <div className="text-xs text-emerald-200/90 mt-0.5">{submittedBanner}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {onNavigateToDashboard && (
              <button
                id="btn-view-in-dashboard"
                onClick={onNavigateToDashboard}
                className="text-xs bg-emerald-800 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg transition"
              >
                View in Admin Dashboard
              </button>
            )}
            <button
              onClick={() => setSubmittedBanner(null)}
              className="text-xs text-emerald-400 hover:text-emerald-200 px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Entry Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Line & Shift Configuration Dropdowns */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span>1. Line, Shift & Product Selection</span>
            </h2>
            <span className="text-[11px] text-slate-500">Cascading Dropdown Menus</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* 1. Date */}
            <div>
              <label htmlFor="field-date" className="block text-xs font-bold text-slate-300 mb-1.5">
                Date <span className="text-rose-400">*</span>
              </label>
              <input
                id="field-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent font-mono"
              />
            </div>

            {/* 2. Shift Dropdown */}
            <div>
              <label htmlFor="field-shift" className="block text-xs font-bold text-slate-300 mb-1.5">
                Shift <span className="text-rose-400">*</span>
              </label>
              <select
                id="field-shift"
                value={shift}
                onChange={(e) => setShift(e.target.value as ShiftType)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
              >
                <option value="Shift 1">Shift 1 (06:00 - 14:00)</option>
                <option value="Shift 2">Shift 2 (14:00 - 22:00)</option>
                <option value="Shift 3">Shift 3 / Night (22:00 - 06:00)</option>
              </select>
            </div>

            {/* 3. Production Line Dropdown (SMT, MI, MI-Finishing, FA-Lum, FA-Ref) */}
            <div>
              <label htmlFor="field-prod-line" className="block text-xs font-bold text-slate-300 mb-1.5">
                Production Line <span className="text-rose-400">*</span>
              </label>
              <select
                id="field-prod-line"
                value={productionLine}
                onChange={(e) => setProductionLine(e.target.value as ProductionLine)}
                className="w-full bg-slate-800 border border-sky-500/60 rounded-xl px-3.5 py-2.5 text-xs text-sky-300 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="SMT">SMT (Surface Mount Technology)</option>
                <option value="MI">MI (Manual Insertion)</option>
                <option value="MI-Finishing">MI-Finishing (Wave/Touchup)</option>
                <option value="FA-Lum">FA- Lum (Final Assembly Luminaires)</option>
                <option value="FA-Ref">FA- Ref (Final Assembly Reflectors/Retrofit)</option>
              </select>
            </div>

            {/* 4. Sub Line Dropdown (Dynamically filtered by Production Line!) */}
            <div>
              <label htmlFor="field-sub-line" className="block text-xs font-bold text-slate-300 mb-1.5">
                Sub Line (Filtered for {productionLine}) <span className="text-rose-400">*</span>
              </label>
              <select
                id="field-sub-line"
                value={subLine}
                onChange={(e) => setSubLine(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {availableSubLines.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Product Dropdown (Filtered by selected Line) */}
            <div className="lg:col-span-2">
              <label htmlFor="field-product" className="block text-xs font-bold text-slate-300 mb-1.5">
                Product / Model Selection <span className="text-rose-400">*</span>
              </label>
              <select
                id="field-product"
                value={productName}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {availableProducts.map((p) => (
                  <option key={p.code} value={p.name}>
                    {p.name} ({p.code}) — Std Target: {p.targetPerHour}/hr
                  </option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* Section 2: Production Targets, Output & Manpower */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>2. Quantity Metrics & Manpower</span>
            </h2>
            <span className="text-[11px] text-slate-500">Live Efficiency Calculation</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Plan (Target) */}
            <div>
              <label htmlFor="field-plan" className="block text-xs font-bold text-slate-300 mb-1.5">
                Plan (Target Units) <span className="text-rose-400">*</span>
              </label>
              <input
                id="field-plan"
                type="number"
                min="1"
                value={plan}
                onChange={(e) => setPlan(e.target.value === '' ? '' : Number(e.target.value))}
                required
                placeholder="e.g. 1200"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Achieved (Actual Produced) */}
            <div>
              <label htmlFor="field-achieved" className="block text-xs font-bold text-slate-300 mb-1.5">
                Achieved (Actual Units) <span className="text-rose-400">*</span>
              </label>
              <input
                id="field-achieved"
                type="number"
                min="0"
                value={achieved}
                onChange={(e) => setAchieved(e.target.value === '' ? '' : Number(e.target.value))}
                required
                placeholder="e.g. 1150"
                className="w-full bg-slate-800 border border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-sm text-emerald-300 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Manpower Used */}
            <div>
              <label htmlFor="field-manpower" className="block text-xs font-bold text-slate-300 mb-1.5">
                Manpower Used (Operators) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="field-manpower"
                  type="number"
                  min="1"
                  value={manpowerUsed}
                  onChange={(e) => setManpowerUsed(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <Users className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Total Working Hours */}
            <div>
              <label htmlFor="field-hours" className="block text-xs font-bold text-slate-300 mb-1.5">
                Total Working Hrs <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="field-hours"
                  type="number"
                  step="0.5"
                  min="1"
                  max="24"
                  value={totalWorkingHrs}
                  onChange={(e) => setTotalWorkingHrs(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

          </div>

          {/* Real-time Computed KPI Banner */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            
            {/* Efficiency */}
            <div className="text-center p-2 rounded-lg bg-slate-800/80">
              <div className="text-[11px] text-slate-400 font-medium">Efficiency Rate</div>
              <div className={`text-lg font-black font-mono mt-0.5 ${
                efficiencyPercent >= 90 ? 'text-emerald-400' : efficiencyPercent >= 80 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {efficiencyPercent}%
              </div>
              <div className="text-[10px] text-slate-500">Target: ≥90%</div>
            </div>

            {/* Variance */}
            <div className="text-center p-2 rounded-lg bg-slate-800/80">
              <div className="text-[11px] text-slate-400 font-medium">Plan Variance</div>
              <div className={`text-lg font-black font-mono mt-0.5 ${
                variance >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {variance > 0 ? `+${variance}` : variance}
              </div>
              <div className="text-[10px] text-slate-500">units</div>
            </div>

            {/* Total Man-Hours */}
            <div className="text-center p-2 rounded-lg bg-slate-800/80">
              <div className="text-[11px] text-slate-400 font-medium">Floor Man-Hours</div>
              <div className="text-lg font-black font-mono text-sky-400 mt-0.5">
                {totalManHours.toFixed(0)} <span className="text-xs font-normal text-slate-400">hrs</span>
              </div>
              <div className="text-[10px] text-slate-500">{numericManpower} ops × {numericHrs}h</div>
            </div>

            {/* Units per Man-Hour */}
            <div className="text-center p-2 rounded-lg bg-slate-800/80">
              <div className="text-[11px] text-slate-400 font-medium">Productivity</div>
              <div className="text-lg font-black font-mono text-indigo-300 mt-0.5">
                {unitsPerManHour}
              </div>
              <div className="text-[10px] text-slate-500">units/man-hour</div>
            </div>

          </div>

          {/* Quality & Rejection Notes */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-800/80">
            <div>
              <label htmlFor="field-rejections" className="block text-xs font-medium text-slate-400 mb-1">
                Scrap / Rejection Qty (Units)
              </label>
              <input
                id="field-rejections"
                type="number"
                min="0"
                value={rejectionQty}
                onChange={(e) => setRejectionQty(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="field-rejection-reason" className="block text-xs font-medium text-slate-400 mb-1">
                Defect Classification / Rejection Reason
              </label>
              <input
                id="field-rejection-reason"
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Solder bridge on pin 4-5, Hi-Pot leakage, Cold solder"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Material Shortages & Store Requisitions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>3. Material Shortages & Store Requisition</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Log critical part shortages. Administrator and Store Manager are immediately notified in real-time.
              </p>
            </div>

            <button
              id="btn-add-shortage-toggle"
              type="button"
              onClick={() => setShowShortageForm(!showShortageForm)}
              className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showShortageForm ? 'Cancel Shortage' : 'Report Shortage'}</span>
            </button>
          </div>

          {/* Inline Add Shortage Form */}
          {showShortageForm && (
            <div className="mb-5 bg-slate-800/90 border border-amber-500/40 rounded-xl p-4 space-y-3">
              <div className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Add Shortage Item for {productionLine} ({subLine})</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="field-shortage-part" className="block text-[11px] font-bold text-slate-300 mb-1">
                    Part Number / Component Code
                  </label>
                  <input
                    id="field-shortage-part"
                    type="text"
                    value={shortagePart}
                    onChange={(e) => setShortagePart(e.target.value)}
                    placeholder="e.g. IC-TPS9201, LED-2835"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono"
                  />
                  {/* Quick helper BOM chips */}
                  {availableProducts.find(p => p.name === productName)?.keyBOMComponents && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <span className="text-[10px] text-slate-500">Quick BOM:</span>
                      {availableProducts.find(p => p.name === productName)?.keyBOMComponents.map(chip => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => {
                            setShortagePart(chip);
                            setShortageDesc(`BOM Component for ${productName}`);
                          }}
                          className="text-[10px] bg-slate-700/70 hover:bg-slate-700 text-sky-300 px-1.5 py-0.5 rounded border border-slate-600"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="field-shortage-qty" className="block text-[11px] font-bold text-slate-300 mb-1">
                    Shortage Quantity & Unit
                  </label>
                  <div className="flex space-x-2">
                    <input
                      id="field-shortage-qty"
                      type="number"
                      min="1"
                      value={shortageQty}
                      onChange={(e) => setShortageQty(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Qty"
                      className="w-2/3 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-mono font-bold"
                    />
                    <select
                      id="field-shortage-unit"
                      value={shortageUnit}
                      onChange={(e) => setShortageUnit(e.target.value)}
                      className="w-1/3 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200"
                    >
                      <option value="pcs">pcs</option>
                      <option value="reels">reels</option>
                      <option value="panels">panels</option>
                      <option value="sets">sets</option>
                      <option value="meters">meters</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="field-shortage-reason" className="block text-[11px] font-bold text-slate-300 mb-1">
                    Shortage Reason
                  </label>
                  <select
                    id="field-shortage-reason"
                    value={shortageReason}
                    onChange={(e) => setShortageReason(e.target.value as MaterialShortageItem['reason'])}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  >
                    <option value="Defective Batch">Defective Batch / Lot Failure</option>
                    <option value="Supplier Delay">Supplier / Vendor Delay</option>
                    <option value="Line Scrap/Yield Loss">Line Scrap / High Yield Loss</option>
                    <option value="Inward Staging Delay">Inward Staging Delay</option>
                    <option value="Short Received">Short Received in Kit</option>
                    <option value="BOM Discrepancy">BOM Discrepancy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label htmlFor="field-shortage-desc" className="block text-[11px] font-bold text-slate-300 mb-1">
                    Component Description / Notes
                  </label>
                  <input
                    id="field-shortage-desc"
                    type="text"
                    value={shortageDesc}
                    onChange={(e) => setShortageDesc(e.target.value)}
                    placeholder="e.g. Reel 4 defective packaging / missing pin tape"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center space-x-3">
                    <select
                      id="field-shortage-severity"
                      value={shortageSeverity}
                      onChange={(e) => setShortageSeverity(e.target.value as ShortageSeverity)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-medium"
                    >
                      <option value="Critical (Line Stoppage)">Critical (Line Stoppage Risk)</option>
                      <option value="High">High Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="Low">Low / Buffer</option>
                    </select>

                    <label className="flex items-center space-x-1.5 text-xs text-rose-400 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={lineStopRisk}
                        onChange={(e) => setLineStopRisk(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-700 text-rose-600 focus:ring-rose-500"
                      />
                      <span>Line Stop Alert</span>
                    </label>
                  </div>

                  <button
                    id="btn-confirm-add-shortage"
                    type="button"
                    onClick={handleAddShortage}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition"
                  >
                    Add Shortage
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* List of Attached Shortages */}
          {shortages.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
              No material shortages reported for this run. If materials are missing or damaged, click "Report Shortage".
            </div>
          ) : (
            <div className="space-y-2">
              {shortages.map((item) => (
                <div 
                  key={item.id}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                    item.severity.includes('Critical')
                      ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                      : 'bg-slate-800/80 border-slate-700 text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                      item.severity.includes('Critical')
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {item.partNumber}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-100">
                        Shortage: <span className="font-mono text-amber-300 font-bold">{item.shortageQty} {item.unit}</span> ({item.reason})
                      </div>
                      <div className="text-[11px] text-slate-400">{item.description}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-amber-400">
                      {item.severity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveShortage(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition"
                      title="Remove shortage item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: Remarks & Submit Action */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="mb-4">
            <label htmlFor="field-notes" className="block text-xs font-bold text-slate-300 mb-1.5">
              Supervisor Floor Notes / Remarks (Optional)
            </label>
            <textarea
              id="field-notes"
              rows={2}
              value={supervisorNotes}
              onChange={(e) => setSupervisorNotes(e.target.value)}
              placeholder="e.g. SMT Feeder calibration completed. Shift handover clean. Wave solder pot temperature maintained at 255°C."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-800">
            <div className="text-xs text-slate-400 flex items-center space-x-2">
              <Info className="w-4 h-4 text-sky-400" />
              <span>
                Submitting updates the centralized Administrator dashboard immediately.
              </span>
            </div>

            <button
              id="btn-submit-production-run"
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 flex items-center justify-center space-x-2 transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Broadcasting to Administrator...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Submit Production Run & Notify Admin</span>
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};
