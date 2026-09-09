import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card card">
        <div class="auth-brand">
          <span class="material-icons-outlined" style="font-size:36px;color:var(--primary)">event_seat</span>
          <h1>Ascendion Seat Booking</h1>
          <p class="text-muted text-sm">Sign in to your account</p>
        </div>
        <form (ngSubmit)="onLogin()" class="mt-4">
          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" type="email" [(ngModel)]="email" name="email" placeholder="you&#64;ascendion.com" required>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <div class="password-wrapper">
              <input id="password" [type]="showPassword() ? 'text' : 'password'" [(ngModel)]="password" name="password" placeholder="Enter password" required>
              <button type="button" class="password-toggle" (click)="showPassword.set(!showPassword())" aria-label="Toggle password visibility">
                <span class="material-icons-outlined">{{ showPassword() ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
          </div>
          @if (error()) { <p class="form-error">{{ error() }}</p> }
          <button type="submit" class="btn btn-primary w-full mt-2" [disabled]="loading()">
            {{ loading() ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
        <div class="auth-links mt-4">
          <a routerLink="/forgot-password">Forgot password?</a>
          <span class="text-muted"> · </span>
          <a routerLink="/register">Create account</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px; background: var(--bg); }
    .auth-card { max-width: 400px; width: 100%; }
    .auth-brand { text-align: center; }
    .auth-brand h1 { font-size: 22px; margin-top: 8px; }
    .auth-links { text-align: center; font-size: 14px; }
    .password-wrapper { position: relative; }
    .password-wrapper input { padding-right: 44px; }
    .password-toggle {
      position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; color: var(--text-secondary);
      padding: 4px; min-height: auto; min-width: auto;
    }
    .password-toggle:hover { color: var(--text); }
  `],
})
export class LoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');
  showPassword = signal(false);

  constructor(private auth: AuthService, private router: Router, private toast: ToastService) {}

  onLogin() {
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.email, this.password).subscribe({
      next: () => { this.toast.success('Welcome back!'); this.router.navigate(['/']); },
      error: (err) => { this.error.set(err.error?.error || 'Login failed'); this.loading.set(false); },
    });
  }
}
