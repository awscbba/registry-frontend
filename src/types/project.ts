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
  project_id: string;  // Backend uses snake_case
  person_id: string;   // Backend uses snake_case
  status: 'active' | 'cancelled' | 'pending';
  person_email?: string;
  person_name?: string;
  email_sent?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  notes?: string | null;
  // Legacy support for camelCase (if needed)
  projectId?: string;
  personId?: string;
  subscribedAt?: string;
  subscribedBy?: string;
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
  totalUsers: number;  // Fix: Changed from totalPeople to totalUsers
  activeUsers: number; // Fix: Added activeUsers field
  adminUsers: number;  // Fix: Added adminUsers field
  totalProjects: number;
  activeProjects: number; // Fix: Added activeProjects field
  totalSubscriptions: number; // Now excludes inactive subscriptions (active + pending only)
  activeSubscriptions: number; // Fix: Added activeSubscriptions field
  pendingSubscriptions: number; // Fix: Added pendingSubscriptions field
  totalSubscriptionsEverCreated?: number; // Historical count including inactive
  recentActivity?: any[]; // Fix: Added recentActivity field
  statistics?: {
    projectsCreatedThisMonth: number;
    subscriptionsThisMonth: number;
    usersCreatedThisMonth: number;
    averageSubscriptionsPerProject: number;
    userEngagementRate: number;
  };
  timestamp: string;
}
