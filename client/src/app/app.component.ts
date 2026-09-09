import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';
import { ToastService } from './services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Toast container -->
    <div class="toast-container">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [class]="'toast-' + t.type">{{ t.message }}</div>
      }
    </div>

    @if (!auth.isLoggedIn()) {
      <router-outlet />
    } @else {
      <div class="app-layout">
        <!-- Sidebar (desktop) -->
        <aside class="sidebar" [class.open]="sidebarOpen()">
          <div class="sidebar-brand">
            <span class="material-icons-outlined" style="vertical-align:middle;margin-right:6px">event_seat</span>
            Ascendion Booking
          </div>
          <nav class="sidebar-nav">
            <a class="sidebar-link" routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" (click)="closeSidebar()">
              <span class="material-icons-outlined">home</span> Home
            </a>
            <a class="sidebar-link" routerLink="/book" routerLinkActive="active" (click)="closeSidebar()">
              <span class="material-icons-outlined">add_circle_outline</span> Book a Seat
            </a>
            <a class="sidebar-link" routerLink="/my-bookings" routerLinkActive="active" (click)="closeSidebar()">
              <span class="material-icons-outlined">list_alt</span> My Bookings
            </a>
            <a class="sidebar-link" routerLink="/notifications" routerLinkActive="active" (click)="closeSidebar()">
              <span class="material-icons-outlined">notifications</span> Notifications
            </a>
            <a class="sidebar-link" routerLink="/profile" routerLinkActive="active" (click)="closeSidebar()">
              <span class="material-icons-outlined">person</span> Profile
            </a>
            @if (auth.isAdmin()) {
              <div style="border-top:1px solid rgba(255,255,255,0.15);margin:12px 0"></div>
              <a class="sidebar-link" routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" (click)="closeSidebar()">
                <span class="material-icons-outlined">dashboard</span> Dashboard & Analytics
              </a>
              <a class="sidebar-link" routerLink="/admin/locations" routerLinkActive="active" (click)="closeSidebar()">
                <span class="material-icons-outlined">location_on</span> Locations
              </a>
              <a class="sidebar-link" routerLink="/admin/users" routerLinkActive="active" (click)="closeSidebar()">
                <span class="material-icons-outlined">group</span> Users
              </a>
              <a class="sidebar-link" routerLink="/admin/block-dates" routerLinkActive="active" (click)="closeSidebar()">
                <span class="material-icons-outlined">block</span> Block Dates
              </a>
              <a class="sidebar-link" routerLink="/admin/audit-log" routerLinkActive="active" (click)="closeSidebar()">
                <span class="material-icons-outlined">history</span> Audit Log
              </a>
              <a class="sidebar-link" routerLink="/admin/announcements" routerLinkActive="active" (click)="closeSidebar()">
                <span class="material-icons-outlined">campaign</span> Announcements
              </a>
              <a class="sidebar-link" routerLink="/admin/sync" routerLinkActive="active" (click)="closeSidebar()">
                <span class="material-icons-outlined">sync</span> OneDrive Sync
              </a>
            }
          </nav>
        </aside>

        <!-- Main content -->
        <main class="main-content">
          <div class="top-bar">
            <div class="flex items-center gap-3">
              <button class="btn-outline btn-sm mobile-menu-btn" (click)="sidebarOpen.set(!sidebarOpen())" aria-label="Toggle menu">
                <span class="material-icons-outlined">menu</span>
              </button>
              <span class="text-sm text-muted">
                <span class="badge badge-primary">{{ auth.user()?.primaryLocation }}</span>
                {{ auth.user()?.name }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <button class="btn-outline btn-sm" (click)="theme.toggle()" [attr.aria-label]="theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'">
                <span class="material-icons-outlined">{{ theme.isDark() ? 'light_mode' : 'dark_mode' }}</span>
              </button>
              <button class="btn-outline btn-sm" (click)="onLogout()" aria-label="Logout">
                <span class="material-icons-outlined">logout</span>
              </button>
            </div>
          </div>
          <router-outlet />
        </main>

        <!-- Bottom nav (mobile) -->
        <nav class="bottom-nav">
          <div class="bottom-nav-items">
            <a class="bottom-nav-item" routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
              <span class="material-icons-outlined">home</span> Home
            </a>
            <a class="bottom-nav-item" routerLink="/book" routerLinkActive="active">
              <span class="material-icons-outlined">add_circle_outline</span> Book
            </a>
            <a class="bottom-nav-item" routerLink="/my-bookings" routerLinkActive="active">
              <span class="material-icons-outlined">list_alt</span> Bookings
            </a>
            <a class="bottom-nav-item" routerLink="/notifications" routerLinkActive="active">
              <span class="material-icons-outlined">notifications</span> Alerts
            </a>
          </div>
        </nav>
      </div>
    }
  `,
  styles: [`
    .mobile-menu-btn { display: none; }
    @media (max-width: 768px) { .mobile-menu-btn { display: inline-flex; } }
  `],
})
export class AppComponent implements OnInit {
  sidebarOpen = signal(false);

  constructor(
    public auth: AuthService,
    public theme: ThemeService,
    public toast: ToastService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.theme.init();
    this.auth.init().subscribe();
  }

  closeSidebar() { this.sidebarOpen.set(false); }

  onLogout() {
    this.auth.logout().subscribe();
  }
}
