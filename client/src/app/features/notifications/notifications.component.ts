import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <div class="flex items-center gap-3">
        <button class="btn btn-outline btn-sm" (click)="router.navigate(['/'])">
          <span class="material-icons-outlined">arrow_back</span>
        </button>
        <h1>Notifications</h1>
      </div>
      @if (unreadCount() > 0) {
        <button class="btn btn-outline btn-sm" (click)="markAllRead()">
          <span class="material-icons-outlined">done_all</span> Mark all as read
        </button>
      }
    </div>

    @if (loading()) {
      @for (i of [1,2,3]; track i) { <div class="skeleton mb-4" style="height:70px"></div> }
    } @else if (notifications().length === 0) {
      <div class="empty-state card">
        <div class="icon material-icons-outlined">notifications_none</div>
        <p>No notifications yet</p>
      </div>
    } @else {
      @for (n of notifications(); track n._id) {
        <div class="card notif-card" [class.notif-read]="n.read" (click)="markRead(n)">
          <span class="material-icons-outlined notif-icon" [style.color]="n.read ? 'var(--text-secondary)' : 'var(--primary)'">
            {{ getIcon(n.type) }}
          </span>
          <div style="flex:1">
            <div>{{ n.message }}</div>
            <div class="text-sm text-muted">{{ n.createdAt | date:'medium' }}</div>
          </div>
          @if (!n.read) { <span class="badge badge-primary">New</span> }
        </div>
      }
    }
  `,
  styles: [`
    .notif-card { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s; }
    .notif-card:hover { transform: translateX(4px); }
    .notif-read { opacity: 0.6; }
    .notif-icon { font-size: 24px; }
  `],
})
export class NotificationsComponent implements OnInit {
  notifications = signal<any[]>([]);
  loading = signal(true);

  unreadCount = computed(() => this.notifications().filter(n => !n.read).length);

  constructor(public router: Router, private api: ApiService, private toast: ToastService) {}

  ngOnInit() {
    this.api.getNotifications().subscribe(n => { this.notifications.set(n); this.loading.set(false); });
  }

  markRead(n: any) {
    if (n.read) return;
    this.api.markNotificationRead(n._id).subscribe(() => {
      this.notifications.update(list => list.map(x => x._id === n._id ? { ...x, read: true } : x));
    });
  }

  markAllRead() {
    this.api.markAllNotificationsRead().subscribe(() => {
      this.notifications.update(list => list.map(x => ({ ...x, read: true })));
      this.toast.success('All notifications marked as read');
    });
  }

  getIcon(type: string): string {
    const map: Record<string, string> = {
      booking_confirmed: 'check_circle', booking_cancelled: 'cancel',
      seat_swapped: 'swap_horiz',
    };
    return map[type] || 'notifications';
  }
}
