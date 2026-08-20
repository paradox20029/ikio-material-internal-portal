export type ProductionLine = 'SMT' | 'MI' | 'MI-Finishing' | 'FA-Lum' | 'FA-Ref';

export type SubLine = 
  | 'Line 1' 
  | 'Line 2' 
  | 'Line 3' 
  | 'High-Speed Line 4'
  | 'Wave Solder A' 
  | 'Wave Solder B'
  | 'Conformal Coating 1'
  | 'Luminaire Cell A' 
  | 'Luminaire Cell B' 
  | 'High-Bay Assembly'
  | 'Reflector Line 1' 
  | 'Retrofit Assembly 2';

export type ShiftType = 'Shift 1' | 'Shift 2' | 'Shift 3';

export type RoleType = 'Administrator' | 'Data Entry Staff' | 'Production Supervisor' | 'Store Manager' | 'Quality Inspector';

export type ShortageSeverity = 'Critical (Line Stoppage)' | 'High' | 'Medium' | 'Low';

export type ApprovalStatus = 'Pending Approval' | 'Approved' | 'Rejected' | 'Dispatched';

export interface User {
  id: string;
  name: string;
  employeeId: string;
  email: string;
  role: RoleType;
  assignedLines: ProductionLine[] | 'ALL';
  shift: ShiftType;
  phone?: string;
  status: 'Active' | 'Inactive';
  lastActive: string;
  avatarColor: string;
}

export interface MaterialShortageItem {
  id: string;
  partNumber: string;
  description: string;
  category: 'IC/Semiconductor' | 'Passives' | 'PCB/MCPCB' | 'Optics/Lenses' | 'Housing/Heatsink' | 'Connectors/Wires' | 'Packaging';
  requiredQty: number;
  shortageQty: number;
  unit: string;
  reason: 'Supplier Delay' | 'Defective Batch' | 'Line Scrap/Yield Loss' | 'Inward Staging Delay' | 'Short Received' | 'BOM Discrepancy';
  severity: ShortageSeverity;
  status: ApprovalStatus;
  requestedBy: string;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  adminRemarks?: string;
  lineStoppageRisk: boolean;
}

export interface ProductionEntry {
  id: string;
  date: string;
  shift: ShiftType;
  productionLine: ProductionLine;
  subLine: string;
  product: string;
  productCode: string;
  workOrderNumber?: string;
  plan: number;
  achieved: number;
  manpowerUsed: number;
  totalWorkingHrs: number;
  
  // Computed values
  efficiencyPercent: number; // (achieved / plan) * 100
  variance: number; // achieved - plan
  unitsPerManHour: number; // achieved / (manpowerUsed * totalWorkingHrs)
  
  // Rejection / QA
  rejectionQty: number;
  rejectionReason?: string;
  
  // Material shortages attached to this run
  shortages: MaterialShortageItem[];
  
  // Metadata & Audit
  enteredBy: string;
  enteredByName: string;
  enteredByRole?: string;
  enteredAt: string;
  status: 'Submitted' | 'Verified' | 'Flagged' | 'Action Required';
  supervisorNotes?: string;
  adminApprovalStatus: ApprovalStatus;
  adminApprovalNotes?: string;
  adminApprovedBy?: string;
  adminApprovedAt?: string;
}

export interface InventoryComponent {
  partNumber: string;
  name: string;
  category: string;
  currentStock: number;
  safetyStock: number;
  allocatedStock: number;
  unit: string;
  location: string;
  supplier: string;
  status: 'In Stock' | 'Low Stock' | 'Critical Shortage';
}

export interface LiveAlert {
  id: string;
  timestamp: string;
  type: 'production_entry' | 'shortage_reported' | 'approval_action' | 'line_stop_warning' | 'staff_added';
  title: string;
  message: string;
  line?: ProductionLine;
  subLine?: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  read: boolean;
  meta?: Record<string, unknown>;
}

export interface LineMapping {
  line: ProductionLine;
  subLines: string[];
  defaultProducts: {
    name: string;
    code: string;
    targetPerHour: number;
    standardManpower: number;
    keyBOMComponents: string[];
  }[];
}
