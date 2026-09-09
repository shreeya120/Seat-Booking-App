import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-header">
      <div class="flex items-center gap-3">
        <button class="btn btn-outline btn-sm" (click)="router.navigate(['/'])">
          <span class="material-icons-outlined">arrow_back</span>
        </button>
        <h1>My Bookings</h1>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-sm" [class.btn-primary]="tab() === 'active'" [class.btn-outline]="tab() !== 'active'" (click)="switchTab('active')">Active</button>
        <button class="btn btn-sm" [class.btn-primary]="tab() === 'history'" [class.btn-outline]="tab() !== 'history'" (click)="switchTab('history')">History</button>
      </div>
    </div>

    @if (loading()) {
      <div class="grid grid-3">
        @for (i of [1,2,3]; track i) { <div class="skeleton" style="height:140px"></div> }
      </div>
    } @else if (currentList().length === 0) {
      <div class="empty-state card">
        <div class="icon material-icons-outlined">{{ tab() === 'active' ? 'event_busy' : 'history' }}</div>
        <p>{{ tab() === 'active' ? 'No active bookings' : 'No booking history' }}</p>
        @if (tab() === 'active') { <a routerLink="/book" class="btn btn-primary btn-sm mt-2">Book Now</a> }
      </div>
    } @else {
      <div class="grid grid-3">
        @for (b of currentList(); track b._id) {
          <div class="card booking-card">
            <div class="flex justify-between items-center">
              <span class="badge badge-primary">{{ b.locationCode }}</span>
              <span class="badge" [class.badge-success]="b.status === 'active'" [class.badge-danger]="b.status === 'cancelled'" [class.badge-warning]="b.status === 'completed'">
                {{ b.status }}
              </span>
            </div>
            <div class="booking-seat">{{ b.seatId?.seatLabel || 'Seat' }}</div>
            <div class="text-sm text-muted">
              {{ b.bookingDate | date:'mediumDate' }}<br>
              {{ b.startTime }} → {{ b.endTime }}
              @if (b.crossesMidnight) { <span>(next day)</span> }
              · {{ b.durationHours }}h
            </div>
            @if (b.status === 'active') {
              <button class="btn btn-danger btn-sm w-full mt-2" (click)="cancelBooking(b._id)">Cancel Booking</button>
            }
            @if (b.cancellationReason) {
              <p class="text-sm text-muted mt-2">Reason: {{ b.cancellationReason }}</p>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .booking-card { transition: transform 0.2s; }
    .booking-card:hover { transform: translateY(-2px); }
    .booking-seat { font-weight: 700; font-size: 18px; margin: 8px 0 4px; }
  `],
})
export class MyBookingsComponent implements OnInit {
  tab = signal<'active' | 'history'>('active');
  active = signal<any[]>([]);
  history = signal<any[]>([]);
  loading = signal(true);
  currentList = signal<any[]>([]);
  historyLoaded = false;

  constructor(public router: Router, private api: ApiService, private toast: ToastService) {}

  ngOnInit() {
    this.api.getMyBookings().subscribe(b => {
      this.active.set(b);
      this.currentList.set(b);
      this.loading.set(false);
    });
  }

  switchTab(tab: 'active' | 'history') {
    this.tab.set(tab);
    if (tab === 'active') { this.currentList.set(this.active()); return; }
    if (!this.historyLoaded) {
      this.loading.set(true);
      this.api.getMyHistory().subscribe(h => {
        this.history.set(h);
        this.currentList.set(h);
        this.loading.set(false);
        this.historyLoaded = true;
      });
    } else {
      this.currentList.set(this.history());
    }
  }

  cancelBooking(id: string) {
    if (!confirm('Cancel this booking?')) return;
    this.api.cancelBooking(id).subscribe({
      next: () => {
        this.toast.success('Booking cancelled');
        this.active.update(list => list.filter(b => b._id !== id));
        this.currentList.set(this.active());
      },
      error: () => this.toast.error('Failed to cancel'),
    });
  }
}
