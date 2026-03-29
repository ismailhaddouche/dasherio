import { Injectable, OnDestroy, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { kdsStore } from '../../store/kds.store';
import { authStore } from '../../store/auth.store';

// Socket event payload types
interface ItemStateChangedPayload {
  itemId: string;
  newState: string;
}

interface ItemDeletedPayload {
  itemId: string;
}

interface KdsNewItem {
  _id: string;
  [key: string]: unknown;
}

type SocketEventCallback<T> = (data: T) => void;

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private hasReachedMaxReconnects = false;
  private connectionRefCount = 0;
  private activeListeners: Map<string, Set<(data: unknown) => void>> = new Map();

  /**
   * Acquire a connection reference. Must be paired with releaseConnection().
   * Uses reference counting to prevent one component from disconnecting socket
   * that other components are still using.
   */
  acquireConnection(): void {
    this.connectionRefCount++;
    console.log(`[Socket] Connection acquired. Ref count: ${this.connectionRefCount}`);
    
    // Only connect on first acquisition
    if (this.connectionRefCount === 1) {
      this.doConnect();
    }
  }

  /**
   * Release a connection reference. When count reaches 0, socket disconnects.
   */
  releaseConnection(): void {
    if (this.connectionRefCount > 0) {
      this.connectionRefCount--;
      console.log(`[Socket] Connection released. Ref count: ${this.connectionRefCount}`);
      
      if (this.connectionRefCount === 0) {
        this.doDisconnect();
      }
    }
  }

  private doConnect(): void {
    // Prevent multiple connection attempts
    if (this.socket?.connected || this.socket?.connecting) return;
    
    try {
      this.socket = io(environment.wsUrl, { 
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      // Connection events
      this.socket.on('connect', () => {
        console.log('Socket connected');
        this.reconnectAttempts = 0;
      });

      this.socket.on('connect_error', (err: Error) => {
        console.error('Socket connection error:', err.message);
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('Max reconnection attempts reached');
          this.hasReachedMaxReconnects = true;
          // Disable auto-reconnection and close properly
          if (this.socket) {
            this.socket.io.opts.reconnection = false;
            this.socket.close();
          }
          this.socket = null;
        }
      });

      this.socket.on('disconnect', (reason: Socket.DisconnectReason) => {
        console.log('Socket disconnected:', reason);
        // Only attempt manual reconnect if socket still exists and auto-reconnect is enabled
        if (reason === 'io server disconnect' && this.socket?.io.opts.reconnection) {
          this.socket.connect();
        }
      });

      this.socket.on('error', (err: Error) => {
        console.error('Socket error:', err);
      });

      // Application events
      this.socket.on('item:state_changed', ({ itemId, newState }: ItemStateChangedPayload) => {
        kdsStore.updateItemState(itemId, newState as 'ORDERED' | 'ON_PREPARE' | 'SERVED' | 'CANCELED');
      });
      
      this.socket.on('kds:new_item', (item: KdsNewItem) => {
        kdsStore.addItem(item as unknown as Parameters<typeof kdsStore.addItem>[0]);
      });

      this.socket.on('item:deleted', ({ itemId }: ItemDeletedPayload) => {
        kdsStore.removeItem(itemId);
      });

    } catch (err) {
      console.error('Failed to initialize socket:', err);
    }
  }

  joinSession(sessionId: string): void {
    if (!this.socket?.connected) {
      console.warn('Cannot join session: socket not connected');
      return;
    }
    this.socket.emit('pos:join', sessionId);
    this.socket.emit('kds:join', sessionId);
  }

  leaveSession(sessionId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('pos:leave', sessionId);
  }

  emit<T = unknown>(event: string, data: T): boolean {
    if (!this.socket?.connected) {
      console.warn(`Cannot emit ${event}: socket not connected`);
      return false;
    }
    this.socket.emit(event, data);
    return true;
  }

  on<T = unknown>(event: string, callback: SocketEventCallback<T>): () => void {
    const wrappedCallback = callback as (data: unknown) => void;
    this.socket?.on(event, wrappedCallback);
    
    // Track for cleanup on disconnect
    if (!this.activeListeners.has(event)) {
      this.activeListeners.set(event, new Set());
    }
    this.activeListeners.get(event)!.add(wrappedCallback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  off<T = unknown>(event: string, callback?: SocketEventCallback<T>): void {
    const wrappedCallback = callback as (data: unknown) => void | undefined;
    if (wrappedCallback) {
      this.socket?.off(event, wrappedCallback);
      // Remove from tracking
      this.activeListeners.get(event)?.delete(wrappedCallback);
    } else {
      this.socket?.off(event);
      // Clear all tracking for this event
      this.activeListeners.delete(event);
    }
  }

  private doDisconnect(): void {
    // Properly close socket and cleanup
    if (this.socket) {
      // Remove all registered application listeners before closing
      this.activeListeners.forEach((callbacks, event) => {
        callbacks.forEach(callback => this.socket?.off(event, callback));
      });
      this.activeListeners.clear();
      
      // Disable reconnection before disconnecting
      this.socket.io.opts.reconnection = false;
      this.socket.close();
      this.socket = null;
    }
    this.reconnectAttempts = 0;
    this.hasReachedMaxReconnects = false;
    this.connectionRefCount = 0;
  }

  ngOnDestroy(): void {
    // Force disconnect on service destruction (app shutdown)
    this.connectionRefCount = 0;
    this.doDisconnect();
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Reset connection state to allow reconnection after max attempts reached.
   * Call this when user manually wants to retry (e.g., click a "Reconnect" button)
   */
  resetConnection(): void {
    this.doDisconnect();
    this.hasReachedMaxReconnects = false;
    this.connectionRefCount = 0;
    this.acquireConnection();
  }

  /**
   * Check if socket has given up reconnecting due to max attempts
   */
  hasConnectionFailed(): boolean {
    return this.hasReachedMaxReconnects;
  }

  /**
   * @deprecated Use acquireConnection() instead. Maintained for backward compatibility.
   * This method behaves like acquireConnection() but may be removed in future versions.
   */
  connect(): void {
    console.warn('[SocketService] connect() is deprecated. Use acquireConnection() instead.');
    this.acquireConnection();
  }

  /**
   * @deprecated Use releaseConnection() instead. Maintained for backward compatibility.
   * This method behaves like releaseConnection() but may be removed in future versions.
   */
  disconnect(): void {
    console.warn('[SocketService] disconnect() is deprecated. Use releaseConnection() instead.');
    this.releaseConnection();
  }
}
