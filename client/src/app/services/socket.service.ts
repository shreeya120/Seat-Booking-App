import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket | null = null;
  seatUpdate = signal<{ seatId: string; available: boolean } | null>(null);

  connect() {
    if (this.socket?.connected) return;
    this.socket = io(environment.socketUrl, { withCredentials: true });
    this.socket.on('seat:update', (data) => this.seatUpdate.set(data));
  }

  joinSeats(locationCode: string, date: string) {
    this.connect();
    this.socket?.emit('join:seats', { locationCode, date });
  }

  leaveSeats(locationCode: string) {
    this.socket?.emit('leave:seats', { locationCode });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}
