
export enum RepairStatus {
  PENDING = 'Pendiente',
  DIAGNOSING = 'En Diagnóstico',
  BUDGET_PENDING = 'Presupuesto Enviado',
  BUDGET_ACCEPTED = 'Presupuesto Aceptado',
  BUDGET_REJECTED = 'Presupuesto Rechazado',
  WAITING_PARTS = 'Esperando Repuestos',
  IN_PROGRESS = 'En Reparación',
  READY = 'Listo para Entrega',
  DELIVERED = 'Entregado',
  CANCELLED = 'Cancelado'
}

// Added rmaPrefix and customerSignature to match usage in components
export interface RepairItem {
  id: string;
  rmaNumber: number;
  rmaPrefix?: string;
  customerName: string;
  customerPhone: string;
  customerSignature?: string;
  deviceType: string;
  brand: string;
  model: string;
  serialNumber: string;
  problemDescription: string;
  entryDate: string;
  status: RepairStatus;
  technician?: string;
  updatedAt?: string;
  notes?: string;
  images?: string[];
  estimatedParts?: number;
  estimatedHours?: number;
}

export interface BudgetItem {
  id: string;
  repairId: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface LaborItem {
  id: string;
  description: string;
  hours: number;
  hourlyRate: number;
}

export interface Budget {
  id: string;
  repairId: string;
  rmaNumber: number;
  items: BudgetItem[];
  laborItems: LaborItem[];
  taxRate: number;
  total: number;
  date: string;
  signature?: string;
  status?: 'pending' | 'accepted' | 'rejected';
}

// Fixed missing Invoice interface reported as error in InvoiceList.tsx
export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  date: string;
  items: BudgetItem[];
  laborItems: LaborItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
}

export interface AppSettings {
  appName: string;
  address: string;
  phone: string;
  taxId: string;
  technicians?: string[];
  hourlyRate?: number;
  taxRate?: number;
  logoUrl?: string;
  letterhead?: string;
  email?: string;
}

export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export type ViewType = 'dashboard' | 'repairs' | 'new-repair' | 'budgets' | 'customers' | 'settings' | 'stats';
