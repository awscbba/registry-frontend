import { memo } from 'react';
import type { Person } from '../types/person';

interface PersonCardProps {
  person: Person;
  onEdit: (person: Person) => void;
  onDelete: (id: string) => void;
}

/**
 * PersonCard component displays a single person in a list
 * Memoized to prevent unnecessary re-renders when other people change
 */
const PersonCard = memo(function PersonCard({ 
  person, 
  onEdit, 
  onDelete 
}: PersonCardProps) {
  return (
    <div className="px-6 py-4 hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {person.firstName.charAt(0)}{person.lastName.charAt(0)}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {person.firstName} {person.lastName}
              </p>
              <p className="text-sm text-gray-500 truncate">{person.email}</p>
              <p className="text-sm text-gray-500 truncate">{person.phone}</p>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-500">
              {person.address.city}, {person.address.state}, {person.address.country}
              {person.address.postalCode && ` - ${person.address.postalCode}`}
            </p>
            <p className="text-xs text-gray-400">
              Nacido: {new Date(person.dateOfBirth).toLocaleDateString('es')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(person)}
            title="Editar información de la persona"
            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </button>
          <button
            onClick={() => onDelete(person.id)}
            title="Eliminar persona permanentemente"
            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if person data or callbacks change
  return (
    prevProps.person.id === nextProps.person.id &&
    prevProps.person.firstName === nextProps.person.firstName &&
    prevProps.person.lastName === nextProps.person.lastName &&
    prevProps.person.email === nextProps.person.email &&
    prevProps.person.phone === nextProps.person.phone &&
    prevProps.person.dateOfBirth === nextProps.person.dateOfBirth &&
    prevProps.person.address.city === nextProps.person.address.city &&
    prevProps.person.address.state === nextProps.person.address.state &&
    prevProps.person.address.country === nextProps.person.address.country &&
    prevProps.person.address.postalCode === nextProps.person.address.postalCode &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onDelete === nextProps.onDelete
  );
});

export default PersonCard;
