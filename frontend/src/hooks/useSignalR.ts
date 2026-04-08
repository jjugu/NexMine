import { useEffect, useRef, useState, useCallback } from 'react';
import {
  HubConnectionBuilder,
  HubConnection,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { useAuthStore } from '../stores/authStore';

const HUB_URL = 'http://localhost:5000/hubs/nexmine';

// Singleton connection instance
let connection: HubConnection | null = null;
let connectionRefCount = 0;

/**
 * Build or return the existing singleton HubConnection.
 * The connection is configured with automatic reconnect and JWT auth via query string.
 */
export function getConnection(token: string): HubConnection {
  if (!connection) {
    connection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();
  }
  return connection;
}

/**
 * React hook that manages the SignalR connection lifecycle.
 * - Starts the connection on mount (if not already started).
 * - Uses a ref-count so the singleton stays alive while any component needs it.
 * - Returns the HubConnection and connection status.
 */
export function useSignalR() {
  const token = useAuthStore((s) => s.token);
  const [isConnected, setIsConnected] = useState(false);
  const connRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    if (!token) return;

    const conn = getConnection(token);
    connRef.current = conn;
    connectionRefCount++;

    async function start() {
      if (conn.state === HubConnectionState.Disconnected) {
        try {
          await conn.start();
          setIsConnected(true);
        } catch (err) {
          console.error('[SignalR] Connection failed:', err);
          setIsConnected(false);
        }
      } else if (conn.state === HubConnectionState.Connected) {
        setIsConnected(true);
      }
    }

    // Listen for reconnect events
    function handleReconnected() {
      setIsConnected(true);
    }
    function handleClose() {
      setIsConnected(false);
    }

    conn.onreconnected(handleReconnected);
    conn.onclose(handleClose);

    start();

    return () => {
      connectionRefCount--;
      // Only stop if no components are using it
      if (connectionRefCount <= 0 && conn.state === HubConnectionState.Connected) {
        conn.stop();
        connection = null;
        connectionRefCount = 0;
      }
    };
  }, [token]);

  /**
   * Subscribe to a hub event. Returns an unsubscribe function.
   * Safe to call even if the connection is not yet established.
   */
  const on = useCallback(
    (eventName: string, handler: (...args: unknown[]) => void) => {
      const conn = connRef.current;
      if (!conn) return () => {};
      conn.on(eventName, handler);
      return () => {
        conn.off(eventName, handler);
      };
    },
    [],
  );

  /**
   * Invoke a hub method. Returns a promise.
   */
  const invoke = useCallback(
    async (methodName: string, ...args: unknown[]) => {
      const conn = connRef.current;
      if (!conn || conn.state !== HubConnectionState.Connected) {
        console.warn(`[SignalR] Cannot invoke "${methodName}" - not connected`);
        return;
      }
      try {
        await conn.invoke(methodName, ...args);
      } catch (err) {
        console.error(`[SignalR] Invoke "${methodName}" failed:`, err);
      }
    },
    [],
  );

  return { connection: connRef.current, isConnected, on, invoke };
}
