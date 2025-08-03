export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'completed';
  createdBy: string;
  maxParticipants?: number;
  startDate?: string;
  endDate?: string;
  registrationEndDate?: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectCreate {
  name: string;
  description: string;
  status?: 'active' | 'inactive' | 'completed';
  createdBy?: string;
  maxParticipants?: number;
  startDate?: string;
  endDate?: string;
  registrationEndDate?: string;
  isEnabled?: boolean;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive' | 'completed';
  maxParticipants?: number;
  startDate?: string;
  endDate?: string;
  registrationEndDate?: string;
  isEnabled?: boolean;
}

export interface Subscription {
  id: string;
  projectId: string;
  personId: string;
  status: 'active' | 'inactive' | 'pending';
  subscribedAt: string;
  subscribedBy: string;
  notes?: string;
}

export interface SubscriptionCreate {
  projectId: string;
  personId: string;
  status?: 'active' | 'inactive' | 'pending';
  subscribedBy?: string;
  notes?: string;
}

export interface ProjectSubscriber {
  id: string; // subscription ID
  personId: string;
  projectId: string;
  status: 'active' | 'inactive' | 'pending';
  subscribedAt: string;
  subscribedBy?: string;
  notes?: string;
  person: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface AdminDashboard {
  totalPeople: number;
  totalProjects: number;
  totalSubscriptions: number;
  timestamp: string;
}
