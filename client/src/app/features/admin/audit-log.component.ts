import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div class="flex items-center gap-3">
        <button class="btn btn-outline btn-sm" (click)="router.navigate(['/admin'])">
          <span class="material-icons-outlined">arrow_back</span>
        </button>
        <h1>Audit Log</h1>
      </div>
      <button class="btn btn-outline btn-sm" (click)="exportCsv()">
        <span class="material-icons-outlined">download</span> Export CSV
      </button>
    </div>

    <div class="flex gap-3 mb-4" style="flex-wrap:wrap">
      <select [(ngModel)]="filterAction" (change)="load()" style="max-width:200px">
        <option value="">All Actions</option>
        @for (a of actions; track a) { <option [value]="a">{{ a }}</option> }
      </select>
      <button class="btn btn-outline btn-sm" (click)="load()">Filter</button>
    </div>

    <div class="table-wrapper card">
      <table>
        <thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Target</th></tr></thead>
        <tbody>
          @for (log of logs(); track log._id) {
            <tr>
              <td class="text-sm">{{ log.createdAt | date:'medium' }}</td>
              <td>{{ log.actorId?.name || 'System' }}</td>
              <td><span class="badge badge-primary" style="font-size:11px">{{ log.action }}</span></td>
              <td class="text-sm">{{ log.targetType }} {{ log.targetId || '' }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    @if (totalPages() > 1) {
      <div class="flex gap-2 mt-4 items-center" style="justify-content:center">
        <button class="btn btn-outline btn-sm" [disabled]="page() <= 1" (click)="page.set(page() - 1); load()">Prev</button>
        <span class="text-sm">Page {{ page() }}</span>
        <button class="btn btn-outline btn-sm" [disabled]="page() >= totalPages()" (click)="page.set(page() + 1); load()">Next</button>
      </div>
    }
  `,
})
export class AuditLogComponent implements OnInit {
  logs = signal<any[]>([]);
  page = signal(1);
  totalPages = signal(1);
  filterAction = '';
  actions = ['BOOKING_CREATED', 'BOOKING_CANCELLED', 'SEAT_ADDED', 'SEAT_REMOVED', 'SEAT_BLOCKED', 'USER_ADDED', 'USER_DEACTIVATED', 'USER_ACTIVATED', 'USER_DELETED', 'USER_LOCATIONS_UPDATED', 'LOCATION_ADDED', 'DATE_BLOCKED', 'PASSWORD_RESET', 'ONEDRIVE_SYNC'];

  constructor(private api: ApiService, public router: Router) {}

  ngOnInit() { this.load(); }

  load() {
    this.api.adminGetAuditLog({ action: this.filterAction, page: this.page() }).subscribe(res => {
      this.logs.set(res.logs);
      this.totalPages.set(Math.ceil(res.total / 50));
    });
  }

  exportCsv() {
    const rows = this.logs().map(l => [l.createdAt, l.actorId?.name || 'System', l.action, l.targetType, l.targetId || ''].join(','));
    const csv = 'Time,Actor,Action,Target Type,Target ID\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'audit-log.csv'; a.click();
    URL.revokeObjectURL(url);
  }
}
