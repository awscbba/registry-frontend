export interface Address {
  street: string;
  city: string;
  state: string; // Department in Bolivia (e.g., La Paz, Santa Cruz, Cochabamba)
  country: string;
  postalCode?: string; // Optional for LATAM countries
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: Address;
  isAdmin?: boolean; // Added for admin role management
  roles?: string[]; // RBAC roles array
  createdAt: string;
  updatedAt: string;
}

export interface PersonCreate {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: Address;
  isAdmin?: boolean; // Added for admin role management
}

export interface PersonUpdate {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: Address;
  isAdmin?: boolean; // Added for admin role management
  userRole?: string; // Added for RBAC role management
}
