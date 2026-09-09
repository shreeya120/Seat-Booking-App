import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-header">
      <div>
        <h1>Welcome, {{ auth.user()?.name }}!</h1>
        <p class="text-muted text-sm">
          <span class="badge badge-primary">{{ auth.user()?.primaryLocation }}</span>
          @if ((auth.user()?.allowedLocations?.length || 0) > 1) {
            <span class="text-sm"> + {{ (auth.user()?.allowedLocations?.length || 1) - 1 }} more locations</span>
          }
        </p>
      </div>
    </div>

    <!-- Announcements -->
    @for (a of announcements(); track a._id) {
      <div class="card mb-4" style="border-left:4px solid var(--accent);background:rgba(255,109,0,0.05)">
        <div class="flex items-center gap-2">
          <span class="material-icons-outlined" style="color:var(--accent)">campaign</span>
          <span>{{ a.message }}</span>
          <span class="badge badge-warning" style="margin-left:auto">{{ a.locationCode }}</span>
        </div>
      </div>
    }

    <!-- Stats -->
    <div class="grid grid-3 mb-4">
      <div class="card text-center">
        <div style="font-size:32px;font-weight:700;color:var(--primary)">{{ activeCount() }}</div>
        @if (auth.isAdmin()) {
          <div class="text-sm text-muted">Active Bookings</div>
        } @else {
          <div class="text-sm text-muted">/ 10 Active Bookings</div>
        }
      </div>
      <a routerLink="/book" class="card text-center" style="cursor:pointer;border:2px solid var(--success)">
        <span class="material-icons-outlined" style="font-size:32px;color:var(--success)">add_circle_outline</span>
        <div class="text-sm mt-2">Book a Seat</div>
      </a>
      <a routerLink="/my-bookings" class="card text-center" style="cursor:pointer">
        <span class="material-icons-outlined" style="font-size:32px;color:var(--primary-light)">list_alt</span>
        <div class="text-sm mt-2">My Bookings</div>
      </a>
    </div>

    <!-- Upcoming bookings -->
    <h2 style="font-size:18px;margin-bottom:12px">Upcoming Bookings</h2>
    @if (loading()) {
      <div class="grid grid-3">
        @for (i of [1,2,3]; track i) { <div class="skeleton" style="height:80px"></div> }
      </div>
    } @else if (bookings().length === 0) {
      <div class="empty-state card">
        <div class="icon material-icons-outlined">event_busy</div>
        <p>No upcoming bookings</p>
        <a routerLink="/book" class="btn btn-primary btn-sm mt-2">Book Now</a>
      </div>
    } @else {
      <div class="grid grid-3">
        @for (b of bookings().slice(0, 3); track b._id) {
          <div class="card">
            <div class="flex justify-between items-center">
              <span class="badge badge-primary">{{ b.locationCode }}</span>
              <span class="badge badge-success">Active</span>
            </div>
            <div style="font-weight:600;margin-top:8px">{{ b.seatId?.seatLabel || 'Seat' }}</div>
            <div class="text-sm text-muted">
              {{ b.bookingDate | date:'mediumDate' }}<br>
              {{ b.startTime }} → {{ b.endTime }}
              @if (b.crossesMidnight) { <span class="text-sm">(next day)</span> }
              · {{ b.durationHours }}h
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class HomeComponent implements OnInit {
  bookings = signal<any[]>([]);
  announcements = signal<any[]>([]);
  activeCount = signal(0);
  loading = signal(true);

  constructor(public auth: AuthService, private api: ApiService) {}

  ngOnInit() {
    this.api.getMyBookings().subscribe(b => {
      this.bookings.set(b);
      this.activeCount.set(b.length);
      this.loading.set(false);
    });
    this.api.getAnnouncements().subscribe(a => this.announcements.set(a));
  }
}
