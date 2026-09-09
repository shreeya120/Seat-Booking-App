import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-user-locations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>Assign Locations</h1>
      <button class="btn btn-outline btn-sm" (click)="router.navigate(['/admin/users'])">Back to Users</button>
    </div>

    <div class="card" style="max-width:480px">
      <p class="mb-4 text-muted">Select locations this user can book seats at:</p>
      @for (loc of allLocations(); track loc.code) {
        <label class="flex items-center gap-2 mb-4" style="cursor:pointer">
          <input type="checkbox" [checked]="selected().includes(loc.code)" (change)="toggleLocation(loc.code)" style="width:20px;height:20px">
          <span>{{ loc.name }} ({{ loc.code }})</span>
        </label>
      }
      <button class="btn btn-primary w-full" (click)="save()" [disabled]="saving()">
        {{ saving() ? 'Saving...' : 'Save Locations' }}
      </button>
    </div>
  `,
})
export class UserLocationsComponent implements OnInit {
  userId = '';
  allLocations = signal<any[]>([]);
  selected = signal<string[]>([]);
  saving = signal(false);

  constructor(private route: ActivatedRoute, public router: Router, private api: ApiService, private toast: ToastService) {}

  ngOnInit() {
    this.userId = this.route.snapshot.params['id'];
    this.api.adminGetLocations().subscribe(locs => this.allLocations.set(locs));
    this.api.adminGetUsers({ search: '', page: 1, limit: 1000 }).subscribe(res => {
      const user = res.users.find((u: any) => u._id === this.userId);
      if (user) this.selected.set(user.allowedLocations || [user.primaryLocation]);
    });
  }

  toggleLocation(code: string) {
    this.selected.update(s => s.includes(code) ? s.filter(c => c !== code) : [...s, code]);
  }

  save() {
    this.saving.set(true);
    this.api.adminUpdateUserLocations(this.userId, this.selected()).subscribe({
      next: () => { this.toast.success('Locations updated'); this.saving.set(false); },
      error: () => { this.toast.error('Failed'); this.saving.set(false); },
    });
  }
}
