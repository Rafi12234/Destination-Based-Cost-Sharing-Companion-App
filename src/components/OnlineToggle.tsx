/**
 * Online Toggle Component
 * Button to go Online/Offline for ride matching
 */

import React from 'react';

interface OnlineToggleProps {
  isOnline: boolean;
  onToggle: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const OnlineToggle: React.FC<OnlineToggleProps> = ({
  isOnline,
  onToggle,
  disabled = false,
  isLoading = false,
}) => {
  return (
    <button
      onClick={onToggle}
      disabled={disabled || isLoading}
      className={`online-toggle ${isOnline ? 'online' : 'offline'} ${isLoading ? 'loading' : ''}`}
    >
      {isLoading ? (
        '⏳ Processing...'
      ) : isOnline ? (
        <>🔴 Go Offline</>
      ) : (
        <>🟢 Go Online</>
      )}

      <style>{`
        .online-toggle {
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .online-toggle.offline {
          background: linear-gradient(135deg, #4CAF50, #45a049);
          color: white;
        }

        .online-toggle.offline:hover:not(:disabled) {
          background: linear-gradient(135deg, #45a049, #3d8b40);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
        }

        .online-toggle.online {
          background: linear-gradient(135deg, #f44336, #d32f2f);
          color: white;
        }

        .online-toggle.online:hover:not(:disabled) {
          background: linear-gradient(135deg, #d32f2f, #c62828);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4);
        }

        .online-toggle:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .online-toggle.loading {
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </button>
  );
};

export default OnlineToggle;
