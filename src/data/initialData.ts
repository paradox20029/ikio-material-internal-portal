import { 
  LineMapping, 
  ProductionEntry, 
  User, 
  InventoryComponent, 
  LiveAlert,
  ProductionLine ,
  WorkOrder
} from '../types';

export const LINE_CONFIGURATIONS: Record<ProductionLine, LineMapping> = {
  'SMT': {
    line: 'SMT',
    subLines: ['Line 1', 'Line 2', 'Line 3', 'High-Speed Line 4'],
    defaultProducts: [
      {
        name: 'LED Driver Controller Board 40W',
        code: 'IK-SMT-DRV-40W',
        targetPerHour: 180,
        standardManpower: 6,
        keyBOMComponents: ['IC-TPS9201-SOIC8', 'CAP-10UF-50V-1206', 'RES-10K-0805-1%', 'MOSFET-AOD4184A']
      },
      {
        name: 'Commercial High-Bay SMT Array 150W',
        code: 'IK-SMT-HB-150W',
        targetPerHour: 120,
        standardManpower: 8,
        keyBOMComponents: ['LED-CREE-2835-4000K', 'MCPCB-ALU-1.6MM', 'DIODE-SCHOTTKY-SMA', 'IND-TOROID-47UH']
      },
      {
        name: 'Downlight Constant Current Engine 18W',
        code: 'IK-SMT-DL-18W',
        targetPerHour: 220,
        standardManpower: 5,
        keyBOMComponents: ['IC-BP2866D-SOP8', 'CAP-ELEC-47UF-400V', 'LED-SANAN-3030', 'FUSE-MICRO-2A']
      },
      {
        name: 'Emergency LED Inverter Control Board',
        code: 'IK-SMT-EMG-INV',
        targetPerHour: 95,
        standardManpower: 7,
        keyBOMComponents: ['MCU-STM8S003F3', 'BATT-CHARGER-IC', 'RELAY-MINI-5V', 'OPTOCOUPLER-EL817']
      }
    ]
  },
  'MI': {
    line: 'MI',
    subLines: ['Line 1', 'Line 2', 'Wave Solder A', 'Wave Solder B'],
    defaultProducts: [
      {
        name: 'Manual Insertion - Driver Power Stage 40W',
        code: 'IK-MI-DRV-40W',
        targetPerHour: 140,
        standardManpower: 12,
        keyBOMComponents: ['TRAFO-EE25-CUSTOM', 'CAP-ELEC-LOW-ESR-100UF', 'MOV-10D471K', 'INDUCTOR-CM-FILTER']
      },
      {
        name: 'Manual Insertion - Industrial High-Bay 150W Stage',
        code: 'IK-MI-HB-150W',
        targetPerHour: 80,
        standardManpower: 16,
        keyBOMComponents: ['TRAFO-PQ3220-150W', 'HEATSINK-EXT-ALU-75MM', 'CAP-X2-0.47UF-275V', 'TERMINAL-BLOCK-3P']
      },
      {
        name: 'Manual Insertion - Batten Lighting Board 36W',
        code: 'IK-MI-BAT-36W',
        targetPerHour: 160,
        standardManpower: 10,
        keyBOMComponents: ['CHOKE-INDUCTOR-10MH', 'WIRE-HARNESS-UL1007', 'FUSE-SLOW-BLOW-3.15A', 'CONN-WAGO-2PIN']
      }
    ]
  },
  'MI-Finishing': {
    line: 'MI-Finishing',
    subLines: ['Line 1', 'Line 2', 'Conformal Coating 1'],
    defaultProducts: [
      {
        name: 'Lead Cropping & Wave Solder Touchup 40W',
        code: 'IK-MIF-TOUCH-40',
        targetPerHour: 150,
        standardManpower: 8,
        keyBOMComponents: ['SOLDER-WIRE-SAC305', 'FLUX-NO-CLEAN-VOC-FREE', 'INSULATION-TAPE-KAPTON']
      },
      {
        name: 'Conformal Coating & Moisture Sealing High-Bay',
        code: 'IK-MIF-COAT-HB',
        targetPerHour: 110,
        standardManpower: 6,
        keyBOMComponents: ['COATING-SILICONE-HUMI', 'THERMAL-PAD-3W-MK', 'RTV-SILICONE-SEALANT']
      },
      {
        name: 'Post-Solder Inspection & Hi-Pot Pre-Check',
        code: 'IK-MIF-QC-PRE',
        targetPerHour: 175,
        standardManpower: 7,
        keyBOMComponents: ['PROBE-PINS-SPRING', 'LABEL-BARCODE-QR', 'QC-PASS-STICKER-GREEN']
      }
    ]
  },
  'FA-Lum': {
    line: 'FA-Lum',
    subLines: ['Luminaire Cell A', 'Luminaire Cell B', 'High-Bay Assembly', 'Line 1', 'Line 2'],
    defaultProducts: [
      {
        name: 'High-Bay Luminaire 150W IP65 Complete',
        code: 'IK-FAL-HB-150W',
        targetPerHour: 65,
        standardManpower: 14,
        keyBOMComponents: ['DIECAST-HOUSING-HB-150', 'TEMPERED-GLASS-4MM', 'PG9-CABLE-GLAND-IP68', 'OPTICAL-LENS-90DEG']
      },
      {
        name: 'Architectural Slim Downlight 18W Trimless',
        code: 'IK-FAL-DL-18W',
        targetPerHour: 130,
        standardManpower: 10,
        keyBOMComponents: ['ALU-TRIM-RING-WHITE', 'DIFFUSER-PLATE-PMMA', 'SPRING-CLIPS-STAINLESS', 'DRV-PACK-18W-ISOLATED']
      },
      {
        name: 'Streetlight Optic Luminaire 120W Type II',
        code: 'IK-FAL-STR-120W',
        targetPerHour: 55,
        standardManpower: 15,
        keyBOMComponents: ['STREET-HOUSING-ALU-IP66', 'SPD-10KV-SURGE-PROT', 'NEMA-RECEPTACLE-7PIN', 'GASKET-SILICONE-MOLDED']
      },
      {
        name: 'Cleanroom IP65 Batten Luminaire 36W',
        code: 'IK-FAL-CLN-36W',
        targetPerHour: 90,
        standardManpower: 11,
        keyBOMComponents: ['EXTRUDED-ALU-BODY-4FT', 'OPAL-DIFFUSER-POLYCARB', 'SS-TOGGLE-LATCHES-6X', 'FAST-FIT-BRACKETS']
      }
    ]
  },
  'FA-Ref': {
    line: 'FA-Ref',
    subLines: ['Reflector Line 1', 'Line 2', 'Retrofit Assembly 2'],
    defaultProducts: [
      {
        name: 'Specular Aluminum Reflector Assembly 150W',
        code: 'IK-FAR-REF-150',
        targetPerHour: 110,
        standardManpower: 8,
        keyBOMComponents: ['ALU-SHEET-ANODIZED-99.8', 'RIVET-POP-ALU-3.2MM', 'COLLAR-RING-GALVANIZED', 'REFLECTIVE-COATING-95']
      },
      {
        name: 'Refrigeration Linear Luminaire 24V Cold-Rated',
        code: 'IK-FAR-REFRIG-24V',
        targetPerHour: 85,
        standardManpower: 10,
        keyBOMComponents: ['CO-EXTRUDED-TUBE-PMMA', 'IP67-ENDCAPS-SILICONE', 'MAG-MOUNTING-CLIPS', 'LOW-TEMP-PVC-CABLE']
      },
      {
        name: 'Magnetic Retrofit LED Troffer Kit 2x4 40W',
        code: 'IK-FAR-RETRO-2X4',
        targetPerHour: 100,
        standardManpower: 9,
        keyBOMComponents: ['MAG-MOUNT-CHANNELS-2X', 'QUICK-DISCONNECT-PLUG', 'FROSTED-LENS-ACRYLIC', 'J-BOX-ADAPTER-PLATE']
      }
    ]
  }
};


/*
 * Seeded work orders. Each corresponds to a real planned job and is what
 * production runs are logged against. plannedQty is deliberately larger than
 * any single shift's output so orders span multiple runs — that is what makes
 * the progress roll-up meaningful.
 *
 * Replace this array with an ERP import when real work orders exist; nothing
 * else needs to change, because progress is always derived from the runs.
 */
export const INITIAL_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'wo-001',
    workOrderNumber: 'WO-2026-SMT-0412',
    product: 'LED Driver Controller Board 40W',
    productCode: 'IK-SMT-DRV-40W',
    productionLine: 'SMT',
    plannedQty: 5000,
    dueDate: '2026-08-28',
    priority: 'High',
    status: 'In Progress',
    raisedBy: 'Rajesh Sharma',
    createdAt: '2026-08-17'
  },
  {
    id: 'wo-002',
    workOrderNumber: 'WO-2026-SMT-0418',
    product: 'Commercial High-Bay SMT Array 150W',
    productCode: 'IK-SMT-HB-150W',
    productionLine: 'SMT',
    plannedQty: 3000,
    dueDate: '2026-08-30',
    priority: 'Normal',
    status: 'In Progress',
    raisedBy: 'Rajesh Sharma',
    createdAt: '2026-08-18'
  },
  {
    id: 'wo-003',
    workOrderNumber: 'WO-2026-MI-0207',
    product: 'Manual Insertion - Driver Power Stage 40W',
    productCode: 'IK-MI-DRV-40W',
    productionLine: 'MI',
    plannedQty: 4000,
    dueDate: '2026-08-27',
    priority: 'High',
    status: 'In Progress',
    raisedBy: 'Amit Verma',
    createdAt: '2026-08-17'
  },
  {
    id: 'wo-004',
    workOrderNumber: 'WO-2026-MIF-0103',
    product: 'Lead Cropping & Wave Solder Touchup 40W',
    productCode: 'IK-MIF-TOUCH-40',
    productionLine: 'MI-Finishing',
    plannedQty: 4000,
    dueDate: '2026-08-26',
    priority: 'Normal',
    status: 'In Progress',
    raisedBy: 'Amit Verma',
    createdAt: '2026-08-17'
  },
  {
    id: 'wo-005',
    workOrderNumber: 'WO-2026-FAL-0356',
    product: 'High-Bay Luminaire 150W IP65 Complete',
    productCode: 'IK-FAL-HB-150W',
    productionLine: 'FA-Lum',
    plannedQty: 2000,
    dueDate: '2026-08-25',
    priority: 'Urgent',
    status: 'In Progress',
    raisedBy: 'Rajesh Sharma',
    createdAt: '2026-08-16'
  },
  {
    id: 'wo-006',
    workOrderNumber: 'WO-2026-FAR-0089',
    product: 'Refrigeration Linear Luminaire 24V Cold-Rated',
    productCode: 'IK-FAR-REFRIG-24V',
    productionLine: 'FA-Ref',
    plannedQty: 1500,
    dueDate: '2026-08-29',
    priority: 'Normal',
    status: 'In Progress',
    raisedBy: 'Rajesh Sharma',
    createdAt: '2026-08-18'
  },
  {
    id: 'wo-007',
    workOrderNumber: 'WO-2026-SMT-0421',
    product: 'Downlight Constant Current Engine 18W',
    productCode: 'IK-SMT-DL-18W',
    productionLine: 'SMT',
    plannedQty: 6000,
    dueDate: '2026-09-02',
    priority: 'Normal',
    status: 'Open',
    raisedBy: 'Rajesh Sharma',
    createdAt: '2026-08-21'
  }
];

export const INITIAL_USERS: User[] = [
  // Real IKIO staff accounts. These are the only two with Firebase Auth
  // logins provisioned; the demo staff below exist so the seeded production
  // history has plausible names attached, but nobody can sign in as them.
  {
    id: 'usr-admin-armaan',
    name: 'Armaan Chetal',
    employeeId: 'IKIO-ADM-002',
    email: 'armaan20029@gmail.com',
    role: 'Administrator',
    assignedLines: 'ALL',
    shift: 'Shift 1',
    status: 'Active',
    lastActive: 'Just now',
    avatarColor: 'bg-violet-600'
  },
  {
    id: 'usr-admin-narendra',
    name: 'Narendra Prasad',
    employeeId: 'IKIO-ADM-003',
    email: 'nppokh@gmail.com',
    role: 'Administrator',
    assignedLines: 'ALL',
    shift: 'Shift 1',
    status: 'Active',
    lastActive: 'Just now',
    avatarColor: 'bg-amber-600'
  },
  {
    id: 'usr-admin-anupam',
    name: 'Anupam De',
    employeeId: 'IKIO-ADM-004',
    email: 'anupam.de@royalux.in',
    role: 'Administrator',
    assignedLines: 'ALL',
    shift: 'Shift 1',
    status: 'Active',
    lastActive: 'Just now',
    avatarColor: 'bg-sky-600'
  },
  {
    id: 'usr-admin-01',
    name: 'Rajesh Sharma',
    employeeId: 'IKIO-ADM-001',
    email: 'admin@ikioems.com',
    role: 'Administrator',
    assignedLines: 'ALL',
    shift: 'Shift 1',
    phone: '+91 98102 34567',
    status: 'Active',
    lastActive: 'Just now',
    avatarColor: 'bg-indigo-600'
  },
  {
    id: 'usr-supervisor-01',
    name: 'Amit Verma',
    employeeId: 'IKIO-SUP-104',
    email: 'amit.verma@ikioems.com',
    role: 'Production Supervisor',
    assignedLines: ['SMT', 'MI', 'MI-Finishing'],
    shift: 'Shift 1',
    phone: '+91 98765 43210',
    status: 'Active',
    lastActive: '12 mins ago',
    avatarColor: 'bg-emerald-600'
  },
  {
    id: 'usr-staff-01',
    name: 'Pooja Rawat',
    employeeId: 'IKIO-OP-201',
    email: 'pooja.rawat@ikioems.com',
    role: 'Data Entry Staff',
    assignedLines: ['SMT', 'MI'],
    shift: 'Shift 1',
    phone: '+91 98451 12345',
    status: 'Active',
    lastActive: '5 mins ago',
    avatarColor: 'bg-sky-600'
  },
  {
    id: 'usr-staff-02',
    name: 'Vikas Kumar',
    employeeId: 'IKIO-OP-202',
    email: 'vikas.kumar@ikioems.com',
    role: 'Data Entry Staff',
    assignedLines: ['FA-Lum', 'FA-Ref'],
    shift: 'Shift 2',
    phone: '+91 98991 76543',
    status: 'Active',
    lastActive: '25 mins ago',
    avatarColor: 'bg-amber-600'
  },
  {
    id: 'usr-store-01',
    name: 'Suresh Patel',
    employeeId: 'IKIO-STR-305',
    email: 'suresh.patel@ikioems.com',
    role: 'Store Manager',
    assignedLines: 'ALL',
    shift: 'Shift 1',
    phone: '+91 97112 88990',
    status: 'Active',
    lastActive: '1 hour ago',
    avatarColor: 'bg-violet-600'
  },
  {
    id: 'usr-qa-01',
    name: 'Sunita Mehra',
    employeeId: 'IKIO-QA-402',
    email: 'sunita.mehra@ikioems.com',
    role: 'Quality Inspector',
    assignedLines: 'ALL',
    shift: 'Shift 1',
    phone: '+91 98114 55667',
    status: 'Active',
    lastActive: '40 mins ago',
    avatarColor: 'bg-rose-600'
  }
];

export const INITIAL_INVENTORY: InventoryComponent[] = [
  {
    partNumber: 'IC-TPS9201-SOIC8',
    name: 'TI High-Efficiency LED Controller IC',
    category: 'IC/Semiconductor',
    currentStock: 4800,
    safetyStock: 8000,
    allocatedStock: 3500,
    unit: 'pcs',
    location: 'Rack SMT-A-04',
    supplier: 'Texas Instruments / Arrow Dist.',
    status: 'Critical Shortage'
  },
  {
    partNumber: 'CAP-10UF-50V-1206',
    name: 'SMD Ceramic Capacitor 10uF 50V X7R',
    category: 'Passives',
    currentStock: 32000,
    safetyStock: 25000,
    allocatedStock: 18000,
    unit: 'pcs',
    location: 'Reel Feeder Rack R-12',
    supplier: 'Murata Electronics',
    status: 'In Stock'
  },
  {
    partNumber: 'LED-CREE-2835-4000K',
    name: 'Cree High-Lumen SMD LED 2835 (CRI>80)',
    category: 'Passives',
    currentStock: 12500,
    safetyStock: 30000,
    allocatedStock: 22000,
    unit: 'pcs',
    location: 'Moisture Barrier Cabinet MB-02',
    supplier: 'Cree LED / Excelitas',
    status: 'Low Stock'
  },
  {
    partNumber: 'MCPCB-ALU-1.6MM',
    name: 'Aluminum Clad PCB 1.6mm 2oz Copper',
    category: 'PCB/MCPCB',
    currentStock: 850,
    safetyStock: 1500,
    allocatedStock: 1200,
    unit: 'panels',
    location: 'Pallet Bay PCB-03',
    supplier: 'IKIO PCB Fabrication Plant',
    status: 'Low Stock'
  },
  {
    partNumber: 'DIECAST-HOUSING-HB-150',
    name: 'Die-Cast Aluminum Heat Sink Housing 150W',
    category: 'Housing/Heatsink',
    currentStock: 420,
    safetyStock: 600,
    allocatedStock: 500,
    unit: 'units',
    location: 'Warehouse Bay WH-A8',
    supplier: 'Apex Casting Technologies',
    status: 'Low Stock'
  },
  {
    partNumber: 'PG9-CABLE-GLAND-IP68',
    name: 'Nickel-Plated Brass Cable Gland PG9',
    category: 'Connectors/Wires',
    currentStock: 3400,
    safetyStock: 2000,
    allocatedStock: 1100,
    unit: 'pcs',
    location: 'Bin FA-G-14',
    supplier: 'Lapp Group India',
    status: 'In Stock'
  },
  {
    partNumber: 'OPTICAL-LENS-90DEG',
    name: 'High-Transmission PMMA Lens Array 90°',
    category: 'Optics/Lenses',
    currentStock: 210,
    safetyStock: 1200,
    allocatedStock: 800,
    unit: 'pcs',
    location: 'Clean Zone Shelf CZ-05',
    supplier: 'Ledil Optics India',
    status: 'Critical Shortage'
  },
  {
    partNumber: 'TRAFO-PQ3220-150W',
    name: 'Custom Switched Power Transformer PQ3220',
    category: 'Passives',
    currentStock: 620,
    safetyStock: 1000,
    allocatedStock: 900,
    unit: 'pcs',
    location: 'Store Bay MI-T-02',
    supplier: 'Wurth Elektronik',
    status: 'Low Stock'
  }
];

export const INITIAL_PRODUCTION_ENTRIES: ProductionEntry[] = [
  {
    id: 'prod-rec-001',
    date: '2026-08-19',
    shift: 'Shift 1',
    productionLine: 'SMT',
    subLine: 'Line 1',
    product: 'LED Driver Controller Board 40W',
    productCode: 'IK-SMT-DRV-40W',
    workOrderId: 'wo-001',
    workOrderNumber: 'WO-2026-SMT-0412',
    plan: 1400,
    achieved: 1320,
    manpowerUsed: 6,
    totalWorkingHrs: 8.0,
    efficiencyPercent: 94.3,
    variance: -80,
    unitsPerManHour: 27.5,
    rejectionQty: 18,
    rejectionReason: 'Solder bridging on IC pins 4-5 corrected at rework',
    shortages: [
      {
        id: 'shrt-001',
        partNumber: 'IC-TPS9201-SOIC8',
        description: 'TI High-Efficiency LED Controller IC',
        category: 'IC/Semiconductor',
        requiredQty: 1400,
        shortageQty: 250,
        unit: 'pcs',
        reason: 'Inward Staging Delay',
        severity: 'High',
        status: 'Approved',
        requestedBy: 'Pooja Rawat',
        requestedAt: '2026-08-19 09:15 AM',
        reviewedBy: 'Rajesh Sharma (Admin)',
        reviewedAt: '2026-08-19 09:40 AM',
        adminRemarks: 'Approved store emergency buffer release from Zone B.',
        lineStoppageRisk: false
      }
    ],
    enteredBy: 'usr-staff-01',
    enteredByName: 'Pooja Rawat',
    enteredAt: '2026-08-19 14:10',
    status: 'Verified',
    supervisorNotes: 'Running smoothly on Yamaha YSM20 pick & place.',
    adminApprovalStatus: 'Approved',
    adminApprovalNotes: 'Production within 94%+ target window.',
    adminApprovedBy: 'Rajesh Sharma',
    adminApprovedAt: '2026-08-19 14:45'
  },
  {
    id: 'prod-rec-002',
    date: '2026-08-19',
    shift: 'Shift 1',
    productionLine: 'SMT',
    subLine: 'Line 2',
    product: 'Commercial High-Bay SMT Array 150W',
    productCode: 'IK-SMT-HB-150W',
    workOrderId: 'wo-002',
    workOrderNumber: 'WO-2026-SMT-0418',
    plan: 900,
    achieved: 880,
    manpowerUsed: 8,
    totalWorkingHrs: 8.0,
    efficiencyPercent: 97.8,
    variance: -20,
    unitsPerManHour: 13.75,
    rejectionQty: 6,
    rejectionReason: 'Cold solder joint at LED array cathode terminal',
    shortages: [],
    enteredBy: 'usr-staff-01',
    enteredByName: 'Pooja Rawat',
    enteredAt: '2026-08-19 14:15',
    status: 'Verified',
    adminApprovalStatus: 'Approved',
    adminApprovedBy: 'Rajesh Sharma',
    adminApprovedAt: '2026-08-19 14:50'
  },
  {
    id: 'prod-rec-003',
    date: '2026-08-19',
    shift: 'Shift 1',
    productionLine: 'MI',
    subLine: 'Line 1',
    product: 'Manual Insertion - Driver Power Stage 40W',
    productCode: 'IK-MI-DRV-40W',
    workOrderId: 'wo-003',
    workOrderNumber: 'WO-2026-MI-0207',
    plan: 1100,
    achieved: 1040,
    manpowerUsed: 12,
    totalWorkingHrs: 8.0,
    efficiencyPercent: 94.5,
    variance: -60,
    unitsPerManHour: 10.83,
    rejectionQty: 12,
    rejectionReason: 'Cropped lead length variance on transformer pins',
    shortages: [],
    enteredBy: 'usr-supervisor-01',
    enteredByName: 'Amit Verma',
    enteredAt: '2026-08-19 14:20',
    status: 'Submitted',
    adminApprovalStatus: 'Approved',
    adminApprovedBy: 'Rajesh Sharma',
    adminApprovedAt: '2026-08-19 15:00'
  },
  {
    id: 'prod-rec-004',
    date: '2026-08-19',
    shift: 'Shift 1',
    productionLine: 'MI-Finishing',
    subLine: 'Line 1',
    product: 'Lead Cropping & Wave Solder Touchup 40W',
    productCode: 'IK-MIF-TOUCH-40',
    workOrderId: 'wo-004',
    workOrderNumber: 'WO-2026-MIF-0103',
    plan: 1200,
    achieved: 1160,
    manpowerUsed: 8,
    totalWorkingHrs: 8.0,
    efficiencyPercent: 96.7,
    variance: -40,
    unitsPerManHour: 18.12,
    rejectionQty: 4,
    shortages: [],
    enteredBy: 'usr-supervisor-01',
    enteredByName: 'Amit Verma',
    enteredAt: '2026-08-19 14:25',
    status: 'Verified',
    adminApprovalStatus: 'Approved'
  },
  {
    id: 'prod-rec-005',
    date: '2026-08-19',
    shift: 'Shift 1',
    productionLine: 'FA-Lum',
    subLine: 'High-Bay Assembly',
    product: 'High-Bay Luminaire 150W IP65 Complete',
    productCode: 'IK-FAL-HB-150W',
    workOrderId: 'wo-005',
    workOrderNumber: 'WO-2026-FAL-0356',
    plan: 500,
    achieved: 380,
    manpowerUsed: 14,
    totalWorkingHrs: 8.0,
    efficiencyPercent: 76.0,
    variance: -120,
    unitsPerManHour: 3.39,
    rejectionQty: 15,
    rejectionReason: 'Pressure leak test failed on IP65 silicone gasket joint',
    shortages: [
      {
        id: 'shrt-002',
        partNumber: 'OPTICAL-LENS-90DEG',
        description: 'High-Transmission PMMA Lens Array 90°',
        category: 'Optics/Lenses',
        requiredQty: 500,
        shortageQty: 120,
        unit: 'pcs',
        reason: 'Defective Batch',
        severity: 'Critical (Line Stoppage)',
        status: 'Pending Approval',
        requestedBy: 'Pooja Rawat',
        requestedAt: '2026-08-19 11:30 AM',
        lineStoppageRisk: true,
        adminRemarks: 'Awaiting Admin fast-track vendor replacement PO signoff.'
      }
    ],
    enteredBy: 'usr-staff-01',
    enteredByName: 'Pooja Rawat',
    enteredAt: '2026-08-19 14:30',
    status: 'Action Required',
    supervisorNotes: 'Line slowed down due to 90° optical lens defect and lack of replacement parts from supplier.',
    adminApprovalStatus: 'Pending Approval'
  },
  {
    id: 'prod-rec-006',
    date: '2026-08-19',
    shift: 'Shift 2',
    productionLine: 'FA-Ref',
    subLine: 'Line 2',
    product: 'Refrigeration Linear Luminaire 24V Cold-Rated',
    productCode: 'IK-FAR-REFRIG-24V',
    workOrderId: 'wo-006',
    workOrderNumber: 'WO-2026-FAR-0089',
    plan: 650,
    achieved: 630,
    manpowerUsed: 10,
    totalWorkingHrs: 8.0,
    efficiencyPercent: 96.9,
    variance: -20,
    unitsPerManHour: 7.87,
    rejectionQty: 5,
    shortages: [],
    enteredBy: 'usr-staff-02',
    enteredByName: 'Vikas Kumar',
    enteredAt: '2026-08-19 22:10',
    status: 'Submitted',
    adminApprovalStatus: 'Pending Approval'
  }
];

export const INITIAL_ALERTS: LiveAlert[] = [
  {
    id: 'alt-001',
    timestamp: '10 mins ago',
    type: 'line_stop_warning',
    title: 'Critical Material Shortage Alert',
    message: 'FA-Lum High-Bay Assembly reported shortage of 120 pcs OPTICAL-LENS-90DEG. Line stoppage risk flagged.',
    line: 'FA-Lum',
    subLine: 'High-Bay Assembly',
    severity: 'critical',
    read: false
  },
  {
    id: 'alt-002',
    timestamp: '25 mins ago',
    type: 'production_entry',
    title: 'New Production Run Logged',
    message: 'Shift 2 FA-Ref Line 2 data logged by Vikas Kumar (Achieved: 630 / Plan: 650).',
    line: 'FA-Ref',
    subLine: 'Line 2',
    severity: 'info',
    read: false
  },
  {
    id: 'alt-003',
    timestamp: '1 hour ago',
    type: 'approval_action',
    title: 'Material Requisition Approved',
    message: 'Admin Rajesh Sharma approved emergency store issue for SMT Line 1 (250 pcs IC-TPS9201).',
    line: 'SMT',
    subLine: 'Line 1',
    severity: 'success',
    read: true
  }
];
