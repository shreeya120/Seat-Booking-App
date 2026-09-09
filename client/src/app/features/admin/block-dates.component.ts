import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-block-dates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div class="flex items-center gap-3">
        <button class="btn btn-outline btn-sm" (click)="router.navigate(['/admin'])">
          <span class="material-icons-outlined">arrow_back</span>
        </button>
        <h1>Block Dates</h1>
      </div>
    </div>

    <div class="card mb-4" style="max-width:480px">
      <h3 style="margin-bottom:12px">Block a Date</h3>
      <div class="form-group">
        <label>Location (or ALL)</label>
        <select [(ngModel)]="newBlock.locationCode">
          <option value="ALL">ALL Locations</option>
          @for (loc of locations(); track loc.code) {
            <option [value]="loc.code">{{ loc.name }}</option>
          }
        </select>
      </div>
      <div class="form-group"><label>Date</label><input type="date" [(ngModel)]="newBlock.blockedDate"></div>
      <div class="form-group"><label>Reason</label><input [(ngModel)]="newBlock.reason" placeholder="e.g. Public holiday"></div>
      <button class="btn btn-primary btn-sm" (click)="blockDate()">Block Date</button>
    </div>

    <h2 style="font-size:18px;margin-bottom:12px">Blocked Dates</h2>
    @if (blockedDates().length === 0) {
      <p class="text-muted">No blocked dates</p>
    } @else {
      <div class="table-wrapper card">
        <table>
          <thead><tr><th>Date</th><th>Location</th><th>Reason</th><th>Action</th></tr></thead>
          <tbody>
            @for (bd of blockedDates(); track bd._id) {
              <tr>
                <td>{{ bd.blockedDate | date:'mediumDate' }}</td>
                <td><span class="badge badge-primary">{{ bd.locationCode }}</span></td>
                <td>{{ bd.reason || '—' }}</td>
                <td><button class="btn btn-outline btn-sm" (click)="unblock(bd._id)">Unblock</button></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class BlockDatesComponent implements OnInit {
  blockedDates = signal<any[]>([]);
  locations = signal<any[]>([]);
  newBlock = { locationCode: 'ALL', blockedDate: '', reason: '' };

  constructor(private api: ApiService, private toast: ToastService, public router: Router) {}

  ngOnInit() {
    this.load();
    this.api.adminGetLocations().subscribe(l => this.locations.set(l));
  }

  load() { this.api.adminGetBlockedDates().subscribe(d => this.blockedDates.set(d)); }

  blockDate() {
    this.api.adminBlockDate(this.newBlock).subscribe({
      next: () => { this.toast.success('Date blocked — affected bookings cancelled'); this.newBlock = { locationCode: 'ALL', blockedDate: '', reason: '' }; this.load(); },
      error: (e) => this.toast.error(e.error?.error || 'Failed'),
    });
  }

  unblock(id: string) {
    this.api.adminUnblockDate(id).subscribe({ next: () => { this.toast.success('Unblocked'); this.load(); } });
  }
}
