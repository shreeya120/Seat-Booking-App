import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { BookingStateService } from '../../services/booking-state.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-book',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div class="flex items-center gap-3">
        <button class="btn btn-outline btn-sm" (click)="goBack()">
          <span class="material-icons-outlined">arrow_back</span>
        </button>
        <h1>Book a Seat</h1>
      </div>
      <span class="text-sm text-muted">Step 1 of 3</span>
    </div>

    <div class="card booking-form">
      <div class="form-group">
        <label>Location</label>
        @if (locations().length <= 1) {
          <input [value]="selectedLocation()" disabled>
        } @else {
          <select [(ngModel)]="selectedLocation" name="location">
            @for (loc of locations(); track loc) {
              <option [value]="loc">{{ loc }}</option>
            }
          </select>
        }
      </div>

      <div class="form-group">
        <label>Date</label>
        <input type="date" [(ngModel)]="selectedDate" name="date" [min]="minDate()" [max]="maxDate()" (change)="onDateChange()">
        @if (dateError()) { <p class="form-error">{{ dateError() }}</p> }
      </div>

      <div class="time-row">
        <div class="form-group">
          <label>Start Time (24h)</label>
          <input type="time" [(ngModel)]="startTime" name="startTime">
        </div>
        <div class="form-group">
          <label>End Time (24h)</label>
          <input type="time" [(ngModel)]="endTime" name="endTime">
        </div>
      </div>

      @if (startTime() && endTime()) {
        <div class="duration-card">
          <span class="material-icons-outlined">schedule</span>
          <span>
            Duration: <strong>{{ durationInfo().hours }} hours</strong>
            @if (durationInfo().crossesMidnight) {
              <span class="badge badge-warning">Crosses midnight</span>
            }
          </span>
          @if (durationInfo().error) {
            <p class="form-error">{{ durationInfo().error }}</p>
          }
        </div>
      }

      <button class="btn btn-primary w-full" (click)="onNext()" [disabled]="!canProceed()">
        Next — Select Seat
      </button>

      @if (!auth.isAdmin()) {
        <div class="text-sm text-muted mt-2" style="text-align:center">
          Employees: max 10 bookings in next 15 days · 1 booking per day · 1hr buffer between seats
        </div>
      }
    </div>
  `,
  styles: [`
    .booking-form { max-width: 520px; }
    .time-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .duration-card {
      display: flex; align-items: center; gap: 8px;
      background: var(--bg); padding: 12px 16px; border-radius: var(--radius); margin-bottom: 16px;
    }
    .duration-card .badge { margin-left: 8px; }
  `],
})
export class BookComponent implements OnInit {
  selectedLocation = signal('');
  selectedDate = signal('');
  startTime = signal('');
  endTime = signal('');
  locations = signal<string[]>([]);
  blockedDates = signal<any[]>([]);
  bookedDates = signal<string[]>([]);
  dateError = signal('');

  constructor(
    public auth: AuthService,
    private api: ApiService,
    private bookingState: BookingStateService,
    private router: Router,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    const user = this.auth.user();
    const locs = user?.allowedLocations?.length ? user.allowedLocations : [user?.primaryLocation || ''];
    this.locations.set(locs);
    this.selectedLocation.set(user?.primaryLocation || locs[0]);

    this.api.getBlockedDates(this.selectedLocation()).subscribe(dates => this.blockedDates.set(dates));

    // Fetch user's active bookings to check duplicate dates (employees only)
    if (!this.auth.isAdmin()) {
      this.api.getMyBookings().subscribe(bookings => {
        const dates = bookings.map((b: any) => {
          const d = new Date(b.startDatetime || b.bookingDate);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        });
        this.bookedDates.set(dates);
      });
    }

    const draft = this.bookingState.draft();
    if (draft) {
      this.selectedLocation.set(draft.locationCode);
      this.selectedDate.set(draft.bookingDate);
      this.startTime.set(draft.startTime);
      this.endTime.set(draft.endTime);
    }
  }

  minDate = computed(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });

  maxDate = computed(() => {
    const isAdmin = this.auth.isAdmin();
    const d = new Date();
    d.setDate(d.getDate() + (isAdmin ? 90 : 15));
    return d.toISOString().split('T')[0];
  });

  onDateChange() {
    this.dateError.set('');
    const date = this.selectedDate();
    if (!date) return;

    const d = new Date(date);
    const day = d.getDay();

    // Block weekends
    if (day === 0 || day === 6) {
      this.dateError.set('Weekends (Saturday & Sunday) are not available for booking');
      return;
    }

    // Check blocked dates
    const blocked = this.blockedDates().find(bd => {
      const bdDate = new Date(bd.blockedDate).toISOString().split('T')[0];
      return bdDate === date && (bd.locationCode === this.selectedLocation() || bd.locationCode === 'ALL');
    });
    if (blocked) {
      this.dateError.set(`Date blocked: ${blocked.reason || 'Unavailable for booking'}`);
      return;
    }

    // Check if user already has a booking on this date
    if (this.bookedDates().includes(date)) {
      this.dateError.set('You already have a booking on this date. One booking per day allowed.');
      return;
    }
  }

  durationInfo = computed(() => {
    const s = this.startTime(), e = this.endTime();
    if (!s || !e) return { hours: 0, crossesMidnight: false, error: '' };
    const info = this.bookingState.computeDatetimes('2025-01-01', s, e);
    let error = '';
    if (info.durationHours < 3) error = 'Minimum 3 hours required';
    if (info.durationHours > 12) error = 'Maximum 12 hours allowed';
    return { hours: info.durationHours, crossesMidnight: info.crossesMidnight, error };
  });

  canProceed = computed(() => {
    const d = this.durationInfo();
    return this.selectedLocation() && this.selectedDate() && this.startTime() && this.endTime()
      && d.hours >= 3 && d.hours <= 12 && !this.dateError();
  });

  goBack() { this.router.navigate(['/']); }

  onNext() {
    const info = this.bookingState.computeDatetimes(this.selectedDate(), this.startTime(), this.endTime());
    this.bookingState.setDraft({
      locationCode: this.selectedLocation(),
      bookingDate: this.selectedDate(),
      startTime: this.startTime(),
      endTime: this.endTime(),
      ...info,
    });
    this.router.navigate(['/book/seats']);
  }
}
