import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div class="flex items-center gap-3">
        <button class="btn btn-outline btn-sm" (click)="router.navigate(['/admin'])">
          <span class="material-icons-outlined">arrow_back</span>
        </button>
        <h1>Announcements</h1>
      </div>
    </div>

    <div class="card mb-4" style="max-width:520px">
      <h3 style="margin-bottom:12px">Post Announcement</h3>
      <div class="form-group">
        <label>Location</label>
        <select [(ngModel)]="newAnn.locationCode">
          <option value="ALL">ALL Locations</option>
          @for (loc of locations(); track loc.code) {
            <option [value]="loc.code">{{ loc.name }}</option>
          }
        </select>
      </div>
      <div class="form-group"><label>Message</label><textarea [(ngModel)]="newAnn.message" rows="3" placeholder="Type announcement..."></textarea></div>
      <button class="btn btn-primary btn-sm" (click)="post()">Post</button>
    </div>

    @for (a of announcements(); track a._id) {
      <div class="card mb-4 flex justify-between items-center">
        <div>
          <span class="badge badge-primary">{{ a.locationCode }}</span>
          <span style="margin-left:8px">{{ a.message }}</span>
          <div class="text-sm text-muted">{{ a.createdAt | date:'medium' }}</div>
        </div>
        <button class="btn btn-outline btn-sm" (click)="remove(a._id)">Remove</button>
      </div>
    }
  `,
})
export class AnnouncementsComponent implements OnInit {
  announcements = signal<any[]>([]);
  locations = signal<any[]>([]);
  newAnn = { locationCode: 'ALL', message: '' };

  constructor(private api: ApiService, private toast: ToastService, public router: Router) {}

  ngOnInit() {
    this.load();
    this.api.adminGetLocations().subscribe(l => this.locations.set(l));
  }

  load() { this.api.adminGetAnnouncements().subscribe(a => this.announcements.set(a)); }

  post() {
    this.api.adminCreateAnnouncement(this.newAnn).subscribe({
      next: () => { this.toast.success('Posted'); this.newAnn.message = ''; this.load(); },
      error: (e) => this.toast.error(e.error?.error || 'Failed'),
    });
  }

  remove(id: string) {
    this.api.adminDeleteAnnouncement(id).subscribe({ next: () => { this.toast.success('Removed'); this.load(); } });
  }
}
