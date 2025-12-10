// src/hooks/usePlayerDisconnectCountdown.ts
import { useEffect, useState, useRef } from 'react';
import { socketService } from '../api/socket';
import toast from 'react-hot-toast';

export interface DisconnectedPlayer {
  username: string;
  timeout: number;
}

export const usePlayerDisconnectCountdown = () => {
  const [disconnectedPlayer, setDisconnectedPlayer] = useState<DisconnectedPlayer | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const onPlayerDisconnected = (data: { username: string; timeout?: number }) => {
      const timeout = data.timeout ?? 30;
      setDisconnectedPlayer({ username: data.username, timeout });
      setCountdown(timeout);
      toast.error(`${data.username} disconnected. Waiting for reconnection...`);
    };

    const onPlayerReconnected = (data: { username: string }) => {
      setDisconnectedPlayer(null);
      setCountdown(null);
      toast.success(`${data.username} reconnected!`);
    };

    socketService.on('player_disconnected', onPlayerDisconnected);
    socketService.on('player_reconnected', onPlayerReconnected);

    return () => {
      socketService.off('player_disconnected', onPlayerDisconnected);
      socketService.off('player_reconnected', onPlayerReconnected);
    };
  }, []);

  useEffect(() => {
    if (countdown === null) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (countdown > 0) {
      intervalRef.current = window.setInterval(() => {
        setCountdown(prev => {
          if (prev === null) return null;
          if (prev <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [countdown]);

  return {
    disconnectedPlayer,
    countdown,
    clearDisconnected: () => {
      setDisconnectedPlayer(null);
      setCountdown(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };
};
