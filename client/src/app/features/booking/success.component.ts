import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BookingStateService } from '../../services/booking-state.service';

@Component({
  selector: 'app-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="text-center" style="padding:48px 16px">
      <span class="material-icons-outlined" style="font-size:64px;color:var(--success)">check_circle</span>
      <h1 style="margin-top:16px">Booking Confirmed!</h1>
      <p class="text-muted mt-2">Your seat has been reserved. A confirmation email is on its way.</p>
      @if (bookingState.lastBookingId()) {
        <p class="text-sm text-muted mt-2">Booking ID: {{ bookingState.lastBookingId() }}</p>
      }
      <div class="flex gap-3 mt-4" style="justify-content:center;flex-wrap:wrap">
        <a routerLink="/book" class="btn btn-outline">Book Another</a>
        <a routerLink="/my-bookings" class="btn btn-primary">View My Bookings</a>
        <a routerLink="/" class="btn btn-outline">Go Home</a>
      </div>
    </div>
  `,
})
export class SuccessComponent {
  constructor(public bookingState: BookingStateService) {}
}
