// src/hooks/useSocketConnection.ts
import { useEffect, useState, useCallback } from 'react';
import { socketService } from '../api/socket';
import toast from 'react-hot-toast';

export const useSocketConnection = (autoConnect = true) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(socketService.isConnected());

  useEffect(() => {
    const onConnected = () => {
      setIsConnected(true);
      setIsConnecting(false);
      toast.success('Connected to game server');
    };
    const onDisconnected = (data: any) => {
      setIsConnected(false);
      if (data?.reason !== 'io client disconnect') {
        toast.error('Disconnected from server. Reconnecting...');
      }
    };
    const onReconnecting = () => setIsConnecting(true);
    const onError = (d: any) => toast.error(`Connection error: ${d?.message ?? 'Unknown'}`);

    socketService.on('socket:connected', onConnected);
    socketService.on('socket:disconnected', onDisconnected);
    socketService.on('socket:reconnecting', onReconnecting);
    socketService.on('socket:error', onError);

    if (autoConnect && !socketService.isConnected()) {
      const token = localStorage.getItem('token');
      setIsConnecting(true);
      socketService.connect(token ?? undefined);
    }

    return () => {
      socketService.off('socket:connected', onConnected);
      socketService.off('socket:disconnected', onDisconnected);
      socketService.off('socket:reconnecting', onReconnecting);
      socketService.off('socket:error', onError);
    };
  }, [autoConnect]);

  const reconnect = useCallback(() => {
    setIsConnecting(true);
    socketService.reconnect();
  }, []);

  const disconnect = useCallback(() => {
    socketService.disconnect();
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  return {
    isConnecting,
    isConnected,
    reconnect,
    disconnect,
  };
};
