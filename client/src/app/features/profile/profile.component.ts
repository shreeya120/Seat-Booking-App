import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <div class="flex items-center gap-3">
        <button class="btn btn-outline btn-sm" (click)="router.navigate(['/'])">
          <span class="material-icons-outlined">arrow_back</span>
        </button>
        <h1>Profile</h1>
      </div>
    </div>
    @if (auth.user(); as u) {
      <div class="card profile-card">
        <div class="profile-header">
          <div class="profile-avatar">{{ u.name.charAt(0) }}</div>
          <div>
            <div class="profile-name">{{ u.name }}</div>
            <div class="text-sm text-muted">{{ u.email }}</div>
          </div>
        </div>
        <div class="summary-grid">
          <div class="summary-row"><span class="text-muted">Role</span><span class="badge" [class.badge-primary]="u.role === 'admin'" [class.badge-success]="u.role === 'employee'">{{ u.role }}</span></div>
          <div class="summary-row"><span class="text-muted">Employee ID</span><span>{{ u.employeeId }}</span></div>
          <div class="summary-row"><span class="text-muted">Department</span><span>{{ u.department || '-' }}</span></div>
          <div class="summary-row"><span class="text-muted">Primary Location</span><span class="badge badge-primary">{{ u.primaryLocation }}</span></div>
          <div class="summary-row"><span class="text-muted">Allowed Locations</span><span>{{ u.allowedLocations?.join(', ') || u.primaryLocation }}</span></div>
        </div>
      </div>
    }
  `,
  styles: [`
    .profile-card { max-width: 480px; }
    .profile-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
    .profile-avatar {
      width: 56px; height: 56px; border-radius: 50%; background: var(--primary);
      color: #fff; display: flex; align-items: center; justify-content: center;
      font-size: 24px; font-weight: 700;
    }
    .profile-name { font-weight: 700; font-size: 20px; }
    .summary-grid { display: flex; flex-direction: column; }
    .summary-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border); }
  `],
})
export class ProfileComponent {
  constructor(public auth: AuthService, public router: Router) {}
}
