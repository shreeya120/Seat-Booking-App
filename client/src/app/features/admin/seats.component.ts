import { Component, OnInit, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin-seats',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>Seats — {{ locationCode }}</h1>
      <div class="flex gap-2">
        <button class="btn btn-primary btn-sm" (click)="showAdd.set(!showAdd())">Add Seat</button>
        <button class="btn btn-outline btn-sm" (click)="showBulk.set(!showBulk())">Bulk Add</button>
      </div>
    </div>

    @if (showAdd()) {
      <div class="card mb-4" style="max-width:480px">
        <h3 style="margin-bottom:12px">Add Seat</h3>
        <div class="grid grid-2">
          <div class="form-group"><label>Seat Number</label><input type="number" [(ngModel)]="newSeat.seatNumber"></div>
          <div class="form-group"><label>Label</label><input [(ngModel)]="newSeat.seatLabel" [placeholder]="locationCode + '-1'"></div>
        </div>
        <div class="form-group"><label>Zone</label><input [(ngModel)]="newSeat.zone" placeholder="e.g. Zone A"></div>
        <button class="btn btn-primary btn-sm" (click)="addSeat()">Save</button>
      </div>
    }

    @if (showBulk()) {
      <div class="card mb-4" style="max-width:480px">
        <h3 style="margin-bottom:12px">Bulk Add Seats</h3>
        <div class="grid grid-2">
          <div class="form-group"><label>Start Number</label><input type="number" [(ngModel)]="bulk.startNumber"></div>
          <div class="form-group"><label>End Number</label><input type="number" [(ngModel)]="bulk.endNumber"></div>
        </div>
        <div class="form-group"><label>Zone</label><input [(ngModel)]="bulk.zone"></div>
        <button class="btn btn-primary btn-sm" (click)="bulkAdd()">Add Range</button>
      </div>
    }

    <div class="grid grid-5">
      @for (seat of seats(); track seat._id) {
        <div class="seat-card"
          [class.seat-available]="seat.isActive && !seat.isBlocked"
          [class.seat-blocked]="seat.isBlocked"
          [class.seat-booked]="!seat.isActive">
          <span class="seat-label">{{ seat.seatLabel }}</span>
          <span class="seat-zone">{{ seat.zone }}</span>
          @if (seat.isBlocked) { <span class="text-sm" style="color:var(--danger)">Blocked</span> }
          @if (!seat.isActive) { <span class="text-sm text-muted">Removed</span> }
          <div class="flex gap-1 mt-2" style="flex-wrap:wrap">
            @if (seat.isActive && !seat.isBlocked) {
              <button class="btn btn-danger btn-sm" style="padding:4px 8px;font-size:11px" (click)="blockSeat(seat._id)">Block</button>
            }
            @if (seat.isBlocked) {
              <button class="btn btn-outline btn-sm" style="padding:4px 8px;font-size:11px" (click)="unblockSeat(seat._id)">Unblock</button>
            }
            @if (seat.isActive) {
              <button class="btn btn-outline btn-sm" style="padding:4px 8px;font-size:11px;color:var(--danger)" (click)="deleteSeat(seat._id)">Remove</button>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminSeatsComponent implements OnInit {
  locationCode = '';
  seats = signal<any[]>([]);
  showAdd = signal(false);
  showBulk = signal(false);
  newSeat = { seatNumber: 1, seatLabel: '', zone: '' };
  bulk = { startNumber: 1, endNumber: 10, zone: '' };

  constructor(private route: ActivatedRoute, private api: ApiService, private toast: ToastService) {}

  ngOnInit() {
    this.locationCode = this.route.snapshot.params['locationCode'];
    this.load();
  }

  load() { this.api.adminGetSeats(this.locationCode).subscribe(s => this.seats.set(s.filter((seat: any) => seat.isActive))); }

  addSeat() {
    this.api.adminAddSeat({ ...this.newSeat, locationCode: this.locationCode }).subscribe({
      next: () => { this.toast.success('Seat added'); this.showAdd.set(false); this.load(); },
      error: (e) => this.toast.error(e.error?.error || 'Failed'),
    });
  }

  bulkAdd() {
    this.api.adminBulkAddSeats({ ...this.bulk, locationCode: this.locationCode }).subscribe({
      next: (res: any) => { this.toast.success(`${res.count} seats added`); this.showBulk.set(false); this.load(); },
      error: (e) => this.toast.error(e.error?.error || 'Failed'),
    });
  }

  blockSeat(id: string) {
    const reason = prompt('Block reason:') || '';
    this.api.adminBlockSeat(id, reason).subscribe({ next: () => { this.toast.success('Blocked'); this.load(); } });
  }

  unblockSeat(id: string) {
    this.api.adminUnblockSeat(id).subscribe({ next: () => { this.toast.success('Unblocked'); this.load(); } });
  }

  deleteSeat(id: string) {
    if (!confirm('Remove this seat?')) return;
    this.api.adminDeleteSeat(id).subscribe({ next: () => { this.toast.success('Removed'); this.load(); } });
  }
}
