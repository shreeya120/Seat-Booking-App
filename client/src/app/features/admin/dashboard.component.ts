import { Component, OnInit, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page-header">
      <div class="flex items-center gap-3">
        <button class="btn btn-outline btn-sm" (click)="router.navigate(['/'])">
          <span class="material-icons-outlined">arrow_back</span>
        </button>
        <h1>Admin Dashboard</h1>
      </div>
      <select [(ngModel)]="selectedLocation" (change)="loadCharts()" class="location-filter">
        <option value="">All Locations</option>
        @for (loc of locations(); track loc.code) {
          <option [value]="loc.code">{{ loc.name }}</option>
        }
      </select>
    </div>

    <!-- Stats -->
    <div class="grid grid-4 mb-4">
      <div class="stat-card card">
        <span class="material-icons-outlined stat-icon" style="color:var(--primary)">calendar_today</span>
        <div class="stat-value">{{ stats().totalBookings }}</div>
        <div class="stat-label">Total Bookings</div>
      </div>
      <div class="stat-card card">
        <span class="material-icons-outlined stat-icon" style="color:var(--success)">check_circle</span>
        <div class="stat-value">{{ stats().activeBookings }}</div>
        <div class="stat-label">Active Bookings</div>
      </div>
      <div class="stat-card card">
        <span class="material-icons-outlined stat-icon" style="color:var(--accent)">group</span>
        <div class="stat-value">{{ stats().totalUsers }}</div>
        <div class="stat-label">Total Users</div>
      </div>
      <div class="stat-card card">
        <span class="material-icons-outlined stat-icon" style="color:var(--accent-teal)">location_on</span>
        <div class="stat-value">{{ stats().totalLocations }}</div>
        <div class="stat-label">Locations</div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-4 mb-4">
      <a routerLink="/admin/users" class="action-card card">
        <span class="material-icons-outlined" style="color:var(--primary)">group</span>
        <span>Manage Users</span>
      </a>
      <a routerLink="/admin/locations" class="action-card card">
        <span class="material-icons-outlined" style="color:var(--success)">location_on</span>
        <span>Locations & Seats</span>
      </a>
      <a routerLink="/admin/block-dates" class="action-card card">
        <span class="material-icons-outlined" style="color:var(--danger)">block</span>
        <span>Block Dates</span>
      </a>
      <a routerLink="/admin/announcements" class="action-card card">
        <span class="material-icons-outlined" style="color:var(--accent)">campaign</span>
        <span>Announcements</span>
      </a>
    </div>

    <!-- Charts -->
    <div class="grid grid-2 mb-4">
      <div class="card chart-card"><canvas #dailyChart></canvas></div>
      <div class="card chart-card"><canvas #locationChart></canvas></div>
    </div>
    <div class="grid grid-2 mb-4">
      <div class="card chart-card"><canvas #hourChart></canvas></div>
      <div class="card chart-card"><canvas #dayChart></canvas></div>
    </div>

    <!-- Recent Bookings -->
    <h2 class="section-title">Recent Bookings</h2>
    @if (recentBookings().length) {
      <div class="table-wrapper card">
        <table>
          <thead><tr><th>User</th><th>Seat</th><th>Location</th><th>Date</th><th>Time</th><th>Status</th></tr></thead>
          <tbody>
            @for (b of recentBookings(); track b._id) {
              <tr>
                <td>{{ b.userId?.name || '-' }}</td>
                <td>{{ b.seatId?.seatLabel || '-' }}</td>
                <td><span class="badge badge-primary">{{ b.locationCode }}</span></td>
                <td>{{ b.bookingDate | date:'mediumDate' }}</td>
                <td>{{ b.startTime }} → {{ b.endTime }}</td>
                <td><span class="badge" [class.badge-success]="b.status==='active'" [class.badge-danger]="b.status==='cancelled'" [class.badge-warning]="b.status==='completed'">{{ b.status }}</span></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      <div class="empty-state card"><p class="text-muted">No bookings yet</p></div>
    }
  `,
  styles: [`
    .location-filter { max-width: 180px; }
    .stat-card { text-align: center; padding: 20px; }
    .stat-icon { font-size: 28px; margin-bottom: 4px; }
    .stat-value { font-size: 32px; font-weight: 800; }
    .stat-label { font-size: 13px; color: var(--text-secondary); }
    .action-card { display: flex; align-items: center; gap: 10px; cursor: pointer; transition: transform 0.2s; padding: 16px; }
    .action-card:hover { transform: translateY(-2px); text-decoration: none; }
    .chart-card { padding: 16px; min-height: 260px; }
    .section-title { font-size: 18px; margin-bottom: 12px; }
  `],
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('dailyChart') dailyCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('locationChart') locationCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('hourChart') hourCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('dayChart') dayCanvas!: ElementRef<HTMLCanvasElement>;

  stats = signal({ totalBookings: 0, activeBookings: 0, totalUsers: 0, totalLocations: 0 });
  recentBookings = signal<any[]>([]);
  locations = signal<any[]>([]);
  selectedLocation = '';
  private charts: Chart[] = [];

  constructor(public router: Router, private api: ApiService) {}

  ngOnInit() {
    this.api.adminGetBookings({ limit: 10 }).subscribe(res => {
      this.recentBookings.set(res.bookings);
      this.stats.update(s => ({ ...s, totalBookings: res.total, activeBookings: res.bookings.filter((b: any) => b.status === 'active').length }));
    });
    this.api.adminGetUsers({ limit: 1 }).subscribe(res => this.stats.update(s => ({ ...s, totalUsers: res.total })));
    this.api.adminGetLocations().subscribe(locs => {
      this.locations.set(locs);
      this.stats.update(s => ({ ...s, totalLocations: locs.length }));
    });
  }

  ngAfterViewInit() { this.loadCharts(); }

  loadCharts() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];

    this.api.adminGetAnalytics({ location: this.selectedLocation }).subscribe(data => {
      this.charts.push(new Chart(this.dailyCanvas.nativeElement, {
        type: 'line',
        data: { labels: data.dailyOccupancy.map((d: any) => d._id), datasets: [{ label: 'Bookings/Day', data: data.dailyOccupancy.map((d: any) => d.count), borderColor: '#1a237e', tension: 0.3, fill: true, backgroundColor: 'rgba(26,35,126,0.08)' }] },
        options: { responsive: true, plugins: { title: { display: true, text: 'Daily Occupancy (Last 30 Days)' } } },
      }));
      this.charts.push(new Chart(this.locationCanvas.nativeElement, {
        type: 'bar',
        data: { labels: data.byLocation.map((d: any) => d._id), datasets: [{ label: 'Total Bookings', data: data.byLocation.map((d: any) => d.count), backgroundColor: ['#1a237e', '#3949ab', '#5c6bc0', '#7986cb', '#9fa8da'] }] },
        options: { responsive: true, plugins: { title: { display: true, text: 'Bookings by Location' } } },
      }));
      this.charts.push(new Chart(this.hourCanvas.nativeElement, {
        type: 'bar',
        data: { labels: data.byHour.map((d: any) => d._id + ':00'), datasets: [{ label: 'Bookings', data: data.byHour.map((d: any) => d.count), backgroundColor: '#ff6d00' }] },
        options: { responsive: true, plugins: { title: { display: true, text: 'Bookings by Hour' } } },
      }));
      const dayNames = ['', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      this.charts.push(new Chart(this.dayCanvas.nativeElement, {
        type: 'bar',
        data: { labels: data.byDay.map((d: any) => dayNames[d._id] || d._id), datasets: [{ label: 'Bookings', data: data.byDay.map((d: any) => d.count), backgroundColor: '#00897b' }] },
        options: { responsive: true, plugins: { title: { display: true, text: 'Bookings by Day of Week' } } },
      }));
    });
  }
}
