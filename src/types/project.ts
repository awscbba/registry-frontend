export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'active' | 'ongoing' | 'completed' | 'cancelled';
  createdBy: string;
  maxParticipants?: number;
  startDate?: string;
  endDate?: string;
  registrationEndDate?: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  // New subscription count fields from backend
  subscriptionCount?: number; // Active + pending subscriptions only
  totalSubscriptionsEverCreated?: number; // Historical count including inactive
  availableSlots?: number; // Calculated based on active subscriptions only
}

export interface ProjectCreate {
  name: string;
  description: string;
  status?: 'pending' | 'active' | 'ongoing' | 'completed' | 'cancelled';
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
  status?: 'pending' | 'active' | 'ongoing' | 'completed' | 'cancelled';
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
  status: 'active' | 'cancelled' | 'pending';
  subscribedAt: string;
  subscribedBy: string;
  notes?: string;
}

export interface SubscriptionCreate {
  projectId: string;
  personId: string;
  status?: 'active' | 'cancelled' | 'pending';
  subscribedBy?: string;
  notes?: string;
}

export interface ProjectSubscriber {
  id: string; // subscription ID
  personId: string;
  projectId: string;
  status: 'active' | 'cancelled' | 'pending';
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
  totalSubscriptions: number; // Now excludes inactive subscriptions (active + pending only)
  totalSubscriptionsEverCreated?: number; // Historical count including inactive
  timestamp: string;
}
