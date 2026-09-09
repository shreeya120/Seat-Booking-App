import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page-header">
      <div class="flex items-center gap-3">
        <button class="btn btn-outline btn-sm" (click)="router.navigate(['/admin'])">
          <span class="material-icons-outlined">arrow_back</span>
        </button>
        <h1>Users</h1>
      </div>
      <button class="btn btn-primary btn-sm" (click)="showAdd.set(!showAdd())">Add User</button>
    </div>

    @if (showAdd()) {
      <div class="card mb-4" style="max-width:520px">
        <h3 style="margin-bottom:12px">Add User Manually</h3>
        <div class="grid grid-2">
          <div class="form-group"><label>Name</label><input [(ngModel)]="newUser.name"></div>
          <div class="form-group"><label>Employee ID</label><input [(ngModel)]="newUser.employeeId"></div>
        </div>
        <div class="form-group"><label>Email</label><input type="email" [(ngModel)]="newUser.email"></div>
        <div class="grid grid-2">
          <div class="form-group"><label>Location</label><input [(ngModel)]="newUser.primaryLocation" placeholder="e.g. HYD"></div>
          <div class="form-group"><label>Department</label><input [(ngModel)]="newUser.department"></div>
        </div>
        <button class="btn btn-primary btn-sm" (click)="addUser()">Create</button>
      </div>
    }

    <!-- Filters -->
    <div class="flex gap-3 mb-4" style="flex-wrap:wrap">
      <input [(ngModel)]="search" placeholder="Search name or email..." style="max-width:240px" (keyup.enter)="load()">
      <select [(ngModel)]="filterStatus" (change)="load()" style="max-width:140px">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      <button class="btn btn-outline btn-sm" (click)="load()">Search</button>
    </div>

    <div class="table-wrapper card">
      <table>
        <thead>
          <tr><th>Name</th><th>Email</th><th>ID</th><th>Location</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          @for (u of users(); track u._id) {
            <tr>
              <td>{{ u.name }}</td>
              <td class="text-sm">{{ u.email }}</td>
              <td>{{ u.employeeId }}</td>
              <td><span class="badge badge-primary">{{ u.primaryLocation }}</span></td>
              <td><span class="badge" [class.badge-success]="u.isActive" [class.badge-danger]="!u.isActive">{{ u.isActive ? 'Active' : 'Inactive' }}</span></td>
              <td>
                <div class="flex gap-1">
                  <a [routerLink]="['/admin/user', u._id, 'locations']" class="btn btn-outline btn-sm" style="padding:4px 8px;font-size:11px">Locations</a>
                  @if (u.isActive) {
                    <button class="btn btn-outline btn-sm" style="padding:4px 8px;font-size:11px" (click)="deactivate(u._id)">Deactivate</button>
                  } @else {
                    <button class="btn btn-outline btn-sm" style="padding:4px 8px;font-size:11px" (click)="activate(u._id)">Activate</button>
                  }
                  <button class="btn btn-danger btn-sm" style="padding:4px 8px;font-size:11px" (click)="deleteUser(u._id)">Delete</button>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    @if (totalPages() > 1) {
      <div class="flex gap-2 mt-4 items-center" style="justify-content:center">
        <button class="btn btn-outline btn-sm" [disabled]="page() <= 1" (click)="page.set(page() - 1); load()">Prev</button>
        <span class="text-sm">Page {{ page() }} of {{ totalPages() }}</span>
        <button class="btn btn-outline btn-sm" [disabled]="page() >= totalPages()" (click)="page.set(page() + 1); load()">Next</button>
      </div>
    }
  `,
})
export class AdminUsersComponent implements OnInit {
  users = signal<any[]>([]);
  search = '';
  filterStatus = '';
  page = signal(1);
  totalPages = signal(1);
  showAdd = signal(false);
  newUser = { name: '', email: '', employeeId: '', primaryLocation: '', department: '' };

  constructor(private api: ApiService, private toast: ToastService, public router: Router) {}

  ngOnInit() { this.load(); }

  load() {
    this.api.adminGetUsers({ search: this.search, status: this.filterStatus, page: this.page() }).subscribe(res => {
      this.users.set(res.users);
      this.totalPages.set(res.pages);
    });
  }

  addUser() {
    this.api.adminAddUser(this.newUser).subscribe({
      next: () => { this.toast.success('User created'); this.showAdd.set(false); this.load(); },
      error: (e) => this.toast.error(e.error?.error || 'Failed'),
    });
  }

  deactivate(id: string) {
    if (!confirm('Deactivate this user? Their active bookings will be cancelled.')) return;
    this.api.adminDeactivateUser(id).subscribe({ next: () => { this.toast.success('Deactivated'); this.load(); } });
  }

  activate(id: string) {
    this.api.adminActivateUser(id).subscribe({ next: () => { this.toast.success('Activated'); this.load(); } });
  }

  deleteUser(id: string) {
    if (!confirm('Permanently delete this user?')) return;
    this.api.adminDeleteUser(id).subscribe({ next: () => { this.toast.success('Deleted'); this.load(); } });
  }
}
