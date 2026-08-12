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
  grandeCompagnieId: string | null;
  assignedSubcontractorId: string | null;
  assignedWorkerId: string | null;
  isActive: boolean;
  grandeCompagnie?: Organization | null;
  assignedSubcontractor?: Organization | null;
  tasks?: Task[];
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
}
