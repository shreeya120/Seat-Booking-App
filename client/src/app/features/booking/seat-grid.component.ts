import { Component, OnInit, OnDestroy, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { BookingStateService } from '../../services/booking-state.service';
import { SocketService } from '../../services/socket.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-seat-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <div class="flex items-center gap-3">
        <button class="btn btn-outline btn-sm" (click)="goBack()">
          <span class="material-icons-outlined">arrow_back</span>
        </button>
        <div>
          <h1>Select a Seat</h1>
          <p class="text-sm text-muted">
            {{ draft()?.locationCode }} · {{ draft()?.bookingDate }} · {{ draft()?.startTime }} → {{ draft()?.endTime }}
            @if (draft()?.crossesMidnight) { (next day) }
          </p>
        </div>
      </div>
      <button class="btn btn-outline btn-sm" (click)="refresh()">
        <span class="material-icons-outlined">refresh</span> Refresh
      </button>
    </div>

    <div class="seat-legend">
      <span class="legend-item"><span class="legend-dot available"></span> Available</span>
      <span class="legend-item"><span class="legend-dot booked"></span> Booked</span>
      <span class="legend-item"><span class="legend-dot blocked"></span> Blocked</span>
      <span class="legend-item"><span class="legend-dot selected"></span> Selected</span>
    </div>

    @if (loading()) {
      <div class="grid grid-5">
        @for (i of skeletons; track i) { <div class="skeleton" style="height:100px"></div> }
      </div>
    } @else if (seats().length === 0) {
      <div class="empty-state card">
        <div class="icon material-icons-outlined">event_seat</div>
        <p>No seats found for this location</p>
      </div>
    } @else {
      <div class="grid grid-5">
        @for (seat of seats(); track seat._id) {
          <div class="seat-card"
            [class.seat-available]="seat.available && !seat.isBlocked"
            [class.seat-booked]="!seat.available && !seat.isBlocked"
            [class.seat-blocked]="seat.isBlocked"
            [class.seat-selected]="selectedSeatId() === seat._id"
            (click)="selectSeat(seat)"
            [attr.aria-label]="seat.seatLabel + (seat.available ? ' available' : seat.isBlocked ? ' blocked' : ' booked')"
            [attr.title]="seat.isBlocked ? 'Blocked: ' + seat.blockedReason : !seat.available ? 'Booked' : 'Click to select'"
            role="button" tabindex="0" (keydown.enter)="selectSeat(seat)">
            <span class="material-icons-outlined seat-icon">
              {{ seat.isBlocked ? 'block' : seat.available ? 'event_seat' : 'person' }}
            </span>
            <span class="seat-label">{{ seat.seatLabel }}</span>
            <span class="seat-zone">{{ seat.zone }}</span>
          </div>
        }
      </div>

      @if (selectedSeatId()) {
        <div class="confirm-bar">
          <button class="btn btn-primary w-full" (click)="onNext()">
            Confirm Selection — {{ selectedSeatLabel() }}
          </button>
        </div>
      }
    }
  `,
  styles: [`
    .seat-legend { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
    .legend-item { display: flex; align-items: center; gap: 6px; font-size: 13px; }
    .legend-dot { width: 16px; height: 16px; border-radius: 4px; border: 2px solid; }
    .legend-dot.available { border-color: var(--success); background: rgba(67,160,71,0.15); }
    .legend-dot.booked { border-color: #9e9e9e; background: rgba(158,158,158,0.15); }
    .legend-dot.blocked { border-color: var(--danger); background: rgba(229,57,53,0.15); }
    .legend-dot.selected { border-color: var(--warning); background: rgba(253,216,53,0.3); border-width: 3px; }
    .seat-icon { font-size: 24px; }
    .confirm-bar { position: sticky; bottom: 16px; margin-top: 20px; }
  `],
})
export class SeatGridComponent implements OnInit, OnDestroy {
  seats = signal<any[]>([]);
  loading = signal(true);
  selectedSeatId = signal<string | null>(null);
  selectedSeatLabel = signal('');
  skeletons = Array.from({ length: 10 }, (_, i) => i);
  draft = this.bookingState.draft;

  constructor(
    private api: ApiService,
    private bookingState: BookingStateService,
    private socketService: SocketService,
    private router: Router,
    private toast: ToastService,
  ) {
    effect(() => {
      const update = this.socketService.seatUpdate();
      if (!update) return;
      this.seats.update(seats =>
        seats.map(s => s._id === update.seatId ? { ...s, available: update.available } : s)
      );
      if (update.seatId === this.selectedSeatId() && !update.available) {
        this.selectedSeatId.set(null);
        this.toast.error('That seat was just taken - please pick another');
      }
    });
  }

  ngOnInit() {
    const d = this.draft();
    if (!d) { this.router.navigate(['/book']); return; }
    this.socketService.joinSeats(d.locationCode, d.bookingDate);
    this.refresh();
  }

  ngOnDestroy() {
    const d = this.draft();
    if (d) this.socketService.leaveSeats(d.locationCode);
  }

  refresh() {
    const d = this.draft();
    if (!d) return;
    this.loading.set(true);
    this.api.getAvailableSeats(d.locationCode, d.startDatetime, d.endDatetime).subscribe({
      next: (seats) => { this.seats.set(seats); this.loading.set(false); },
      error: (err) => { this.loading.set(false); this.toast.error(err.error?.error || 'Failed to load seats'); },
    });
  }

  selectSeat(seat: any) {
    if (!seat.available || seat.isBlocked) return;
    this.selectedSeatId.set(seat._id);
    this.selectedSeatLabel.set(seat.seatLabel);
  }

  goBack() { this.router.navigate(['/book']); }

  onNext() {
    const d = this.draft();
    if (!d || !this.selectedSeatId()) return;
    const seat = this.seats().find(s => s._id === this.selectedSeatId());
    this.bookingState.setDraft({ ...d, seatId: this.selectedSeatId()!, seatLabel: seat?.seatLabel, zone: seat?.zone });
    this.router.navigate(['/book/confirm']);
  }
}
