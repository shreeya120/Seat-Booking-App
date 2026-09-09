import { Component, OnInit, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>Analytics</h1>
      <div class="flex gap-2">
        <select [(ngModel)]="selectedLocation" (change)="load()">
          <option value="">All Locations</option>
          @for (loc of locations(); track loc.code) {
            <option [value]="loc.code">{{ loc.name }}</option>
          }
        </select>
      </div>
    </div>

    <div class="grid grid-2 mb-4">
      <div class="card"><canvas #dailyChart></canvas></div>
      <div class="card"><canvas #locationChart></canvas></div>
    </div>
    <div class="grid grid-2">
      <div class="card"><canvas #hourChart></canvas></div>
      <div class="card"><canvas #dayChart></canvas></div>
    </div>
  `,
})
export class AnalyticsComponent implements OnInit, AfterViewInit {
  @ViewChild('dailyChart') dailyCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('locationChart') locationCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('hourChart') hourCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('dayChart') dayCanvas!: ElementRef<HTMLCanvasElement>;

  locations = signal<any[]>([]);
  selectedLocation = '';
  private charts: Chart[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() { this.api.adminGetLocations().subscribe(l => this.locations.set(l)); }
  ngAfterViewInit() { this.load(); }

  load() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];

    this.api.adminGetAnalytics({ location: this.selectedLocation }).subscribe(data => {
      this.charts.push(new Chart(this.dailyCanvas.nativeElement, {
        type: 'line',
        data: { labels: data.dailyOccupancy.map((d: any) => d._id), datasets: [{ label: 'Bookings/Day', data: data.dailyOccupancy.map((d: any) => d.count), borderColor: '#1a237e', tension: 0.3, fill: true, backgroundColor: 'rgba(26,35,126,0.1)' }] },
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
