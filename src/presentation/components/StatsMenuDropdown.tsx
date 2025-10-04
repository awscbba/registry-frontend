import React from 'react';
import { StatsSubMenu, StatsSubMenuType } from '../../domain/entities/AdminDashboard';

interface StatsMenuDropdownProps {
  isOpen: boolean;
  statsItems: StatsSubMenu[];
  onItemSelect: (type: StatsSubMenuType) => void;
  onClose: () => void;
}

export const StatsMenuDropdown: React.FC<StatsMenuDropdownProps> = ({
  isOpen,
  statsItems,
  onItemSelect,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg z-50 border border-gray-200">
      <div className="py-2">
        {statsItems.map((item) => (
          <button
            key={item.type}
            onClick={() => {
              onItemSelect(item.type);
              onClose();
            }}
            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-150 flex items-start space-x-3"
          >
            <span className="text-lg mt-0.5">{item.icon}</span>
            <div>
              <div className="font-medium text-gray-900">{item.label}</div>
              <div className="text-sm text-gray-500 mt-0.5">{item.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
