import { useState } from 'react';
import UserProfile from './UserProfile';
import SubscriptionsList from './SubscriptionsList';
import PasswordChange from './PasswordChange';

type TabType = 'profile' | 'subscriptions';

export default function DashboardContent() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handlePasswordChangeSuccess = () => {
    setSuccessMessage('¡Contraseña cambiada exitosamente!');
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  return (
    <div className="dashboard-content">
      {successMessage && (
        <div className="success-banner">
          <span className="success-icon">✅</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <span className="tab-icon">👤</span>
          <span>Mi Perfil</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'subscriptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscriptions')}
        >
          <span className="tab-icon">📋</span>
          <span>Mis Suscripciones</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'profile' && (
          <UserProfile onPasswordChangeClick={() => setShowPasswordChange(true)} />
        )}
        
        {activeTab === 'subscriptions' && <SubscriptionsList />}
      </div>

      {/* Password Change Modal */}
      {showPasswordChange && (
        <PasswordChange
          onClose={() => setShowPasswordChange(false)}
          onSuccess={handlePasswordChangeSuccess}
        />
      )}

      <style jsx>{`
        .dashboard-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .success-banner {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
          padding: 16px 20px;
          border-radius: 8px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .success-icon {
          font-size: 20px;
        }

        .tab-navigation {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          border-bottom: 2px solid #e5e7eb;
        }

        .tab-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          color: #6b7280;
          font-weight: 500;
          font-size: 15px;
          transition: all 0.2s;
          margin-bottom: -2px;
        }

        .tab-button:hover {
          color: #374151;
          background: #f9fafb;
        }

        .tab-button.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        .tab-icon {
          font-size: 18px;
        }

        .tab-content {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .dashboard-content {
            padding: 12px;
          }

          .tab-button {
            padding: 10px 16px;
            font-size: 14px;
          }

          .tab-button span:not(.tab-icon) {
            display: none;
          }

          .tab-icon {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
}
