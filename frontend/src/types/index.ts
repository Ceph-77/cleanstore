export type RoleKey = "admin" | "grande_compagnie" | "sous_traitant" | "inspecteur" | "travailleur";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  roleKey: RoleKey | null;
}

export interface Organization {
  id: string;
  name: string;
  type: "grande_compagnie" | "sous_traitant";
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
}

export interface StoreContact {
  id: string;
  storeId: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
}

export interface StoreNoteAuthor {
  id: string;
  fullName: string | null;
  email: string;
}

export interface StoreNote {
  id: string;
  storeId: string;
  authorId: string | null;
  content: string;
  createdAt: string;
  author?: StoreNoteAuthor | null;
}

export interface StoreDocument {
  id: string;
  storeId: string;
  fileName: string;
  fileKey: string;
  mimeType: string | null;
  sizeBytes: number | null;
  uploadedById: string | null;
  createdAt: string;
  downloadUrl?: string;
}

export type InvoiceStatus = "unpaid" | "paid" | "overdue";

export interface StoreInvoice {
  id: string;
  storeId: string;
  label: string;
  amount: string;
  status: InvoiceStatus;
  issuedDate: string | null;
  dueDate: string | null;
  paidDate: string | null;
  createdAt: string;
}

export interface Store {
  id: string;
  name: string;
  banner: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  storeManagerName: string | null;
  storeManagerPhone: string | null;
  storeManagerEmail: string | null;
  squareFootage: string | null;
  surfaceType: string | null;
  zones: string[];
  cleaningFrequency: string | null;
  cleaningSchedule: string | null;
  contractStartDate: string | null;
  contractEndDate: string | null;
  contractRate: string | null;
  securityAccessInfo: string | null;
  storeHours: string | null;
  specialRequirements: string | null;
  grandeCompagnieId: string | null;
  assignedSubcontractorId: string | null;
  assignedWorkerId: string | null;
  isActive: boolean;
  grandeCompagnie?: Organization | null;
  assignedSubcontractor?: Organization | null;
  tasks?: Task[];
  contacts?: StoreContact[];
  notes?: StoreNote[];
  invoices?: StoreInvoice[];
}

export interface StoreMapPoint {
  id: string;
  name: string;
  banner: string | null;
  city: string | null;
  address: string | null;
  latitude: string;
  longitude: string;
}

export type TaskStatus = "open" | "claimed" | "completed" | "inspected" | "cancelled";

export interface Task {
  id: string;
  storeId: string;
  description: string;
  taskType: string | null;
  price: string;
  isNegotiable: boolean;
  dueDate: string | null;
  status: TaskStatus;
  assignedToId: string | null;
  store?: { id: string; name: string; city: string | null; address: string | null };
}

export type ClaimStatus = "pending" | "approved" | "rejected";

export interface StoreClaim {
  id: string;
  storeId: string;
  organizationId: string;
  requestedById: string;
  status: ClaimStatus;
  createdAt: string;
  decidedAt: string | null;
  store?: { id: string; name: string; city?: string | null };
  organization?: { id: string; name: string };
  requestedBy?: { id: string; fullName: string | null; email: string };
}

export interface TaskClaim {
  id: string;
  taskId: string;
  workerId: string;
  status: ClaimStatus;
  createdAt: string;
  decidedAt: string | null;
  task?: Task & { store?: { id: string; name: string } };
  worker?: { id: string; fullName: string | null; email: string };
}

export interface AppUser {
  id: string;
  fullName: string | null;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  roles: { role: { key: RoleKey; label: string }; organization: { id: string; name: string } | null }[];
}
