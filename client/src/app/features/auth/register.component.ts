import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card card">
        <div class="auth-brand">
          <h1>Create Account</h1>
          <p class="text-muted text-sm">Join Ascendion Seat Booking</p>
        </div>
        <form (ngSubmit)="onRegister()" class="mt-4">
          <div class="form-group">
            <label>Full Name</label>
            <input [(ngModel)]="form.name" name="name" required placeholder="Your full name">
          </div>
          <div class="form-group">
            <label>Employee ID</label>
            <input [(ngModel)]="form.employeeId" name="employeeId" required placeholder="e.g. EMP001">
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" [(ngModel)]="form.email" name="email" required placeholder="you@ascendion.com">
          </div>
          <div class="form-group">
            <label>Password</label>
            <div class="pw-wrap">
              <input [type]="showPassword() ? 'text' : 'password'" [(ngModel)]="form.secret" name="secret" required placeholder="Min 8 chars, 1 upper, 1 number, 1 special">
              <button type="button" class="pw-btn" (click)="showPassword.set(!showPassword())" aria-label="Toggle visibility">
                <span class="material-icons-outlined">{{ showPassword() ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>Primary Location</label>
            <select [(ngModel)]="form.primaryLocation" name="primaryLocation" required>
              <option value="" disabled>Select location</option>
              @for (loc of locations(); track loc.code) {
                <option [value]="loc.code">{{ loc.name }} ({{ loc.code }})</option>
              }
            </select>
          </div>
          <div class="form-group">
            <label>Department (optional)</label>
            <input [(ngModel)]="form.department" name="department" placeholder="e.g. Engineering">
          </div>
          @if (error()) { <p class="form-error">{{ error() }}</p> }
          <button type="submit" class="btn btn-primary w-full mt-2" [disabled]="loading()">
            {{ loading() ? 'Registering...' : 'Register' }}
          </button>
        </form>
        <div class="auth-links mt-4">
          Already have an account? <a routerLink="/login">Sign in</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px; background: var(--bg); }
    .auth-card { max-width: 440px; width: 100%; }
    .auth-brand { text-align: center; }
    .auth-brand h1 { font-size: 22px; }
    .auth-links { text-align: center; font-size: 14px; }
    .pw-wrap { position: relative; }
    .pw-wrap input { padding-right: 44px; }
    .pw-btn {
      position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; color: var(--text-secondary);
      padding: 4px; min-height: auto; min-width: auto;
    }
    .pw-btn:hover { color: var(--text); }
  `],
})
export class RegisterComponent implements OnInit {
  showPassword = signal(false);
  form = { name: '', employeeId: '', email: '', secret: '', primaryLocation: '', department: '' };
  locations = signal<any[]>([]);
  loading = signal(false);
  error = signal('');

  constructor(private auth: AuthService, private api: ApiService, private router: Router, private toast: ToastService) {}

  ngOnInit() {
    this.api.getLocations().subscribe(locs => this.locations.set(locs));
  }

  onRegister() {
    this.loading.set(true);
    this.error.set('');
    const data: any = { name: this.form.name, employeeId: this.form.employeeId, email: this.form.email, primaryLocation: this.form.primaryLocation, department: this.form.department };
    data['password'] = this.form.secret;
    this.auth.register(data).subscribe({
      next: (res: any) => {
        if (res.autoVerified) {
          this.toast.success('Account created! You can login now.');
          this.router.navigate(['/login']);
        } else {
          this.toast.success('OTP sent to your email!');
          this.router.navigate(['/verify-otp'], { queryParams: { email: this.form.email } });
        }
      },
      error: (err: any) => { this.error.set(err.error?.error || 'Registration failed'); this.loading.set(false); },
    });
  }
}
