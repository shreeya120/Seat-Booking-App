import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-sync',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <div class="flex items-center gap-3">
        <button class="btn btn-outline btn-sm" (click)="router.navigate(['/admin'])">
          <span class="material-icons-outlined">arrow_back</span>
        </button>
        <h1>OneDrive Sync</h1>
      </div>
    </div>

    <div class="card" style="max-width:520px">
      <div class="flex items-center gap-3 mb-4">
        <span class="material-icons-outlined" style="font-size:36px;color:var(--primary)">cloud_sync</span>
        <div>
          <div style="font-weight:600">Employee Data Sync</div>
          <div class="text-sm text-muted">Sync MongoDB users ↔ OneDrive Excel</div>
        </div>
      </div>

      <div class="summary-grid mb-4">
        <div class="summary-row">
          <span class="text-muted">Last Sync</span>
          <span>{{ lastSync() ? (lastSync() | date:'medium') : 'Never' }}</span>
        </div>
        <div class="summary-row">
          <span class="text-muted">Auto Sync</span>
          <span>Every Sunday 1:00 AM IST</span>
        </div>
      </div>

      <button class="btn btn-primary w-full" (click)="triggerSync()" [disabled]="syncing()">
        <span class="material-icons-outlined" style="vertical-align:middle;margin-right:4px">sync</span>
        {{ syncing() ? 'Syncing...' : 'Trigger Manual Sync' }}
      </button>
    </div>
  `,
  styles: [`
    .summary-grid { display: flex; flex-direction: column; gap: 8px; }
    .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border); }
  `],
})
export class SyncComponent implements OnInit {
  lastSync = signal<string | null>(null);
  syncing = signal(false);

  constructor(private api: ApiService, private toast: ToastService, public router: Router) {}

  ngOnInit() {
    this.api.adminSyncStatus().subscribe(res => this.lastSync.set(res.lastSync));
  }

  triggerSync() {
    this.syncing.set(true);
    this.api.adminTriggerSync().subscribe({
      next: (res: any) => { this.lastSync.set(res.syncedAt); this.syncing.set(false); this.toast.success('Sync complete'); },
      error: () => { this.syncing.set(false); this.toast.error('Sync failed'); },
    });
  }
}
