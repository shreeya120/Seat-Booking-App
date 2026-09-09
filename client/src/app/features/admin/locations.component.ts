import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin-locations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page-header">
      <div class="flex items-center gap-3">
        <button class="btn btn-outline btn-sm" (click)="router.navigate(['/admin'])">
          <span class="material-icons-outlined">arrow_back</span>
        </button>
        <h1>Locations</h1>
      </div>
      <button class="btn btn-primary btn-sm" (click)="showAdd.set(!showAdd())">
        <span class="material-icons-outlined">add</span> Add Location
      </button>
    </div>

    @if (showAdd()) {
      <div class="card mb-4" style="max-width:480px">
        <h3 style="margin-bottom:12px">New Location</h3>
        <div class="form-group"><label>Code (e.g. HYD)</label><input [(ngModel)]="newLoc.code" maxlength="5"></div>
        <div class="form-group"><label>Name</label><input [(ngModel)]="newLoc.name" placeholder="e.g. Hyderabad"></div>
        <div class="form-group"><label>Address</label><input [(ngModel)]="newLoc.address"></div>
        <button class="btn btn-primary btn-sm" (click)="addLocation()">Save</button>
      </div>
    }

    <div class="grid grid-3">
      @for (loc of locations(); track loc._id) {
        <div class="card">
          <div class="flex justify-between items-center">
            <div>
              <div style="font-weight:700;font-size:18px">{{ loc.code }}</div>
              <div>{{ loc.name }}</div>
              <div class="text-sm text-muted">{{ loc.address }}</div>
            </div>
            <span class="badge" [class.badge-success]="loc.isActive" [class.badge-danger]="!loc.isActive">
              {{ loc.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <div class="text-sm mt-2">{{ loc.totalSeats }} seats</div>
          <div class="flex gap-2 mt-2">
            <a [routerLink]="['/admin/seats', loc.code]" class="btn btn-outline btn-sm">Manage Seats</a>
            @if (loc.isActive) {
              <button class="btn btn-danger btn-sm" (click)="deactivate(loc._id)">Deactivate</button>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminLocationsComponent implements OnInit {
  locations = signal<any[]>([]);
  showAdd = signal(false);
  newLoc = { code: '', name: '', address: '' };

  constructor(private api: ApiService, private toast: ToastService, public router: Router) {}

  ngOnInit() { this.load(); }

  load() { this.api.adminGetLocations().subscribe(l => this.locations.set(l)); }

  addLocation() {
    this.api.adminAddLocation(this.newLoc).subscribe({
      next: () => { this.toast.success('Location added'); this.showAdd.set(false); this.newLoc = { code: '', name: '', address: '' }; this.load(); },
      error: (e) => this.toast.error(e.error?.error || 'Failed'),
    });
  }

  deactivate(id: string) {
    if (!confirm('Deactivate this location?')) return;
    this.api.adminDeactivateLocation(id).subscribe({ next: () => { this.toast.success('Deactivated'); this.load(); } });
  }
}
