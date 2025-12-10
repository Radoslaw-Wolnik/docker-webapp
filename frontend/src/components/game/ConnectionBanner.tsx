// src/components/game/ConnectionBanner.tsx
import React from 'react';
import { WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';

interface Props {
  isConnecting: boolean;
  isConnected: boolean;
  disconnectedPlayer?: { username: string; timeout: number } | null;
  countdown?: number | null;
  onReconnect: () => void;
}

const ConnectionBanner: React.FC<Props> = ({ isConnecting, isConnected, disconnectedPlayer, countdown, onReconnect }) => {
  return (
    <div className="mb-6">
      {!isConnected && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <WifiOff className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <span className="text-red-800 font-semibold">
                {isConnecting ? 'Connecting to server...' : 'Disconnected from server'}
              </span>
              <p className="text-red-600 text-sm mt-1">
                {isConnecting ? 'Please wait while we establish connection' : 'Your moves may not be saved'}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onReconnect}
            disabled={isConnecting}
            className="border-red-300 hover:bg-red-100"
            icon={<RefreshCw className={`w-4 h-4 ${isConnecting ? 'animate-spin' : ''}`} />}
          >
            {isConnecting ? 'Connecting...' : 'Reconnect'}
          </Button>
        </div>
      )}

      {disconnectedPlayer && (
        <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <span className="text-yellow-800 font-semibold">
                {disconnectedPlayer.username} disconnected{countdown !== null && ` (${countdown}s)`}
              </span>
              <p className="text-yellow-700 text-sm mt-1">Game will be forfeited if they don't reconnect</p>
            </div>
          </div>
          <div className="text-sm text-yellow-700 font-medium bg-yellow-100 px-3 py-1 rounded-full">
            Waiting...
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionBanner;
