export type RoleKey = "admin" | "grande_compagnie" | "sous_traitant" | "inspecteur" | "travailleur";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  phone?: string | null;
  address?: string | null;
  roleKey: RoleKey | null;
  termsAcceptedAt: string | null;
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

export interface GeoPoint {
  lat: number;
  lng: number;
  acc?: number;
  ts?: number;
}

export interface Store {
  id: string;
  name: string;
  banner: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  latitude: string | null;
  longitude: string | null;
  geofenceLat: string | null;
  geofenceLng: string | null;
  geofenceRadiusM: number | null;
  geofencePoints: GeoPoint[] | null;
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
  inspections?: StoreInspection[];
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

export type TaskStatus = "open" | "claimed" | "in_progress" | "completed" | "inspected" | "cancelled";

export interface TaskExpectedPhoto {
  id: string;
  fileName: string;
  fileKey: string;
  createdAt: string;
  downloadUrl?: string;
}

export interface TaskStep {
  id: string;
  taskId: string;
  order: number;
  text: string;
  isDone: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  storeId: string;
  description: string;
  taskType: string | null;
  price: string;
  isNegotiable: boolean;
  isPublished: boolean;
  dueDate: string | null;
  status: TaskStatus;
  assignedToId: string | null;
  workerNote: string | null;
  expectedResultText: string | null;
  howToText: string | null;
  requiredEquipment: string[];
  estimatedDurationMinutes: number | null;
  startedAt: string | null;
  isRecurring: boolean;
  store?: { id: string; name: string; city: string | null; address: string | null };
  inspection?: { id: string; score: number } | null;
  assignedTo?: { id: string; fullName: string | null; email: string } | null;
  expectedPhotos?: TaskExpectedPhoto[];
  steps?: TaskStep[];
}

export type PhotoType = "before" | "after";

export interface InspectionPhoto {
  id: string;
  fileName: string;
  fileKey: string;
  photoType: PhotoType;
  createdAt: string;
  downloadUrl?: string;
}

export interface TaskInspection {
  id: string;
  taskId: string;
  score: number;
  notes: string | null;
  createdById: string | null;
  createdAt: string;
  photos: InspectionPhoto[];
}

export interface ChecklistItem {
  zone: string;
  item: string;
  passed: boolean;
}

export interface StoreInspection {
  id: string;
  storeId: string;
  score: number;
  notes: string | null;
  checklist: ChecklistItem[];
  createdById: string | null;
  createdAt: string;
  photos: InspectionPhoto[];
}

export type ClaimStatus = "pending" | "approved" | "rejected";

export interface StoreClaim {
  id: string;
  storeId: string;
  organizationId: string;
  requestedById: string;
  status: ClaimStatus;
  note: string | null;
  decisionReason: string | null;
  createdAt: string;
  decidedAt: string | null;
  store?: { id: string; name: string; city?: string | null };
  organization?: { id: string; name: string; _count?: { storesAsSubcontractor: number } };
  requestedBy?: { id: string; fullName: string | null; email: string; createdAt?: string };
}

export interface TaskClaim {
  id: string;
  taskId: string;
  workerId: string;
  status: ClaimStatus;
  note: string | null;
  decisionReason: string | null;
  createdAt: string;
  decidedAt: string | null;
  task?: Task & { store?: { id: string; name: string } };
  worker?: {
    id: string;
    fullName: string | null;
    email: string;
    createdAt?: string;
    averageInspectionScore?: number | null;
    _count?: { assignedTasks: number };
  };
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

export type EarningStatus = "pending" | "disputed" | "available" | "withdrawn";
export type WithdrawalStatus = "pending" | "paid" | "failed";

export interface WalletBalance {
  pending: string;
  available: string;
}

export interface WorkerEarning {
  id: string;
  taskId: string;
  grossAmount: string;
  status: EarningStatus;
  availableAt: string;
  createdAt: string;
  task?: { id: string; description: string; store: { name: string } };
}

export interface Feedback {
  id: string;
  userId: string | null;
  role: string | null;
  selector: string;
  context: string;
  section: string;
  note: string;
  isMulti: boolean;
  createdAt: string;
  user?: { id: string; fullName: string | null; email: string } | null;
}

export interface Withdrawal {
  id: string;
  grossAmount: string;
  commissionAmount: string;
  netAmount: string;
  status: WithdrawalStatus;
  createdAt: string;
}
