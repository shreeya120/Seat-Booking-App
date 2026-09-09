import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { BookingStateService } from '../../services/booking-state.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-header">
      <div class="flex items-center gap-3">
        <button class="btn btn-outline btn-sm" (click)="goBack()">
          <span class="material-icons-outlined">arrow_back</span>
        </button>
        <h1>Confirm Booking</h1>
      </div>
      <span class="text-sm text-muted">Step 3 of 3</span>
    </div>

    @if (draft(); as d) {
      <div class="card confirm-card">
        <h2 class="confirm-title">Booking Summary</h2>
        <div class="summary-grid">
          <div class="summary-row"><span class="text-muted">Seat</span><strong>{{ d.seatLabel }}</strong></div>
          <div class="summary-row"><span class="text-muted">Location</span><strong>{{ d.locationCode }}</strong></div>
          <div class="summary-row"><span class="text-muted">Date</span><strong>{{ d.bookingDate }}</strong></div>
          <div class="summary-row">
            <span class="text-muted">Time</span>
            <strong>{{ d.startTime }} → {{ d.endTime }} @if (d.crossesMidnight) { (next day) }</strong>
          </div>
          <div class="summary-row"><span class="text-muted">Duration</span><strong>{{ d.durationHours }} hours</strong></div>
          <div class="summary-row"><span class="text-muted">Employee</span><strong>{{ auth.user()?.name }}</strong></div>
          <div class="summary-row"><span class="text-muted">Email</span><strong>{{ auth.user()?.email }}</strong></div>
        </div>

        @if (error()) { <p class="form-error mt-2">{{ error() }}</p> }

        <div class="confirm-actions">
          <button class="btn btn-outline" style="flex:1" (click)="goBack()">Back</button>
          <button class="btn btn-primary" style="flex:2" (click)="onConfirm()" [disabled]="loading()">
            {{ loading() ? 'Booking...' : 'Confirm Booking' }}
          </button>
        </div>
      </div>
    } @else {
      <div class="empty-state card">
        <p>No booking data. <a routerLink="/book">Start over</a></p>
      </div>
    }
  `,
  styles: [`
    .confirm-card { max-width: 520px; }
    .confirm-title { font-size: 18px; margin-bottom: 16px; }
    .summary-grid { display: flex; flex-direction: column; gap: 2px; }
    .summary-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border); }
    .confirm-actions { display: flex; gap: 12px; margin-top: 20px; }
  `],
})
export class ConfirmComponent {
  draft = this.bookingState.draft;
  loading = signal(false);
  error = signal('');

  constructor(
    public auth: AuthService,
    private api: ApiService,
    private bookingState: BookingStateService,
    private router: Router,
    private toast: ToastService,
  ) {}

  goBack() { this.router.navigate(['/book/seats']); }

  onConfirm() {
    const d = this.draft();
    if (!d?.seatId) return;
    this.loading.set(true);
    this.error.set('');

    this.api.createBooking({
      seatId: d.seatId,
      locationCode: d.locationCode,
      bookingDate: d.bookingDate,
      startTime: d.startTime,
      endTime: d.endTime,
    }).subscribe({
      next: (booking) => {
        this.bookingState.lastBookingId.set(booking._id);
        this.bookingState.clear();
        this.router.navigate(['/book/success']);
      },
      error: (err) => {
        const msg = err.error?.error || 'Booking failed';
        this.error.set(msg);
        this.loading.set(false);
        if (err.status === 409) this.toast.error('Seat just taken - go back and pick another');
      },
    });
  }
}
