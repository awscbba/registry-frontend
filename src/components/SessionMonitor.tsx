import React, { useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { authLogger } from '../utils/logger';

interface SessionMonitorProps {
  warningThreshold?: number; // Show warning when this many seconds remain (default: 5 minutes)
  onSessionExpired?: () => void; // Callback when session expires
  onWarning?: (timeRemaining: number) => void; // Callback when warning threshold is reached
}

export default function SessionMonitor({
  warningThreshold = 300, // 5 minutes
  onSessionExpired,
  onWarning,
}: SessionMonitorProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const checkSession = () => {
      if (!authService.isAuthenticated()) {
        // User is not authenticated or token expired
        if (onSessionExpired) {
          onSessionExpired();
        }
        return;
      }

      const remaining = authService.getTokenTimeRemaining();
      setTimeRemaining(remaining);

      // Show warning if time is running out
      if (remaining <= warningThreshold && remaining > 0) {
        if (!showWarning) {
          setShowWarning(true);
          if (onWarning) {
            onWarning(remaining);
          }
        }
      } else {
        setShowWarning(false);
      }

      // Auto-logout if token expired
      if (remaining <= 0) {
        authLogger.info('Session expired, logging out automatically', {
          event_type: 'session_expired',
        });
        authService.forceLogout();
        if (onSessionExpired) {
          onSessionExpired();
        }
      }
    };

    // Check immediately
    checkSession();

    // Check every 30 seconds
    const interval = setInterval(checkSession, 30000);

    return () => clearInterval(interval);
  }, [warningThreshold, showWarning, onSessionExpired, onWarning]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleExtendSession = async () => {
    // In a real implementation, you might refresh the token here
    // For now, we'll just hide the warning
    setShowWarning(false);
    authLogger.info('Session extension requested', { event_type: 'session_extension_requested' });
  };

  if (!showWarning) {
    return null;
  }

  return (
    <div className="session-warning">
      <div className="session-warning-content">
        <div className="warning-icon">⚠️</div>
        <div className="warning-text">
          <strong>Session expiring soon</strong>
          <p>Your session will expire in {formatTime(timeRemaining)}. Save your work.</p>
        </div>
        <div className="warning-actions">
          <button onClick={handleExtendSession} className="btn btn-primary btn-sm">
            Continue Session
          </button>
        </div>
      </div>

      <style jsx>{`
        .session-warning {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          max-width: 350px;
          animation: slideIn 0.3s ease-out;
        }

        .session-warning-content {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .warning-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .warning-text {
          flex: 1;
        }

        .warning-text strong {
          color: #856404;
          font-size: 14px;
          display: block;
          margin-bottom: 4px;
        }

        .warning-text p {
          color: #856404;
          font-size: 13px;
          margin: 0;
        }

        .warning-actions {
          flex-shrink: 0;
        }

        .btn {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-primary {
          background-color: #007bff;
          color: white;
        }

        .btn-primary:hover {
          background-color: #0056b3;
        }

        .btn-sm {
          padding: 4px 8px;
          font-size: 11px;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
