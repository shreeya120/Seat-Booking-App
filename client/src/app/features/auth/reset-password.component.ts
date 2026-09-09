import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card card">
        <div class="auth-brand">
          <h1>Reset Password</h1>
          <p class="text-muted text-sm">Enter OTP and your new password</p>
        </div>
        <form (ngSubmit)="onSubmit()" class="mt-4">
          <div class="form-group">
            <label>OTP</label>
            <input [(ngModel)]="otp" name="otp" maxlength="6" placeholder="000000" required>
          </div>
          <div class="form-group">
            <label>New Password</label>
            <input type="password" [(ngModel)]="newPassword" name="newPassword" required placeholder="Min 8 chars, 1 upper, 1 number, 1 special">
          </div>
          @if (error()) { <p class="form-error">{{ error() }}</p> }
          <button type="submit" class="btn btn-primary w-full" [disabled]="loading()">
            {{ loading() ? 'Resetting...' : 'Reset Password' }}
          </button>
        </form>
        <div class="auth-links mt-4"><a routerLink="/login">Back to login</a></div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px; background: var(--bg); }
    .auth-card { max-width: 400px; width: 100%; }
    .auth-brand { text-align: center; }
    .auth-brand h1 { font-size: 22px; }
    .auth-links { text-align: center; font-size: 14px; }
  `],
})
export class ResetPasswordComponent implements OnInit {
  email = '';
  otp = '';
  newPassword = '';
  loading = signal(false);
  error = signal('');

  constructor(private auth: AuthService, private route: ActivatedRoute, private router: Router, private toast: ToastService) {}

  ngOnInit() { this.email = this.route.snapshot.queryParams['email'] || ''; }

  onSubmit() {
    this.loading.set(true);
    this.error.set('');
    this.auth.resetPassword(this.email, this.otp, this.newPassword).subscribe({
      next: () => { this.toast.success('Password reset! Please login.'); this.router.navigate(['/login']); },
      error: (err) => { this.error.set(err.error?.error || 'Reset failed'); this.loading.set(false); },
    });
  }
}
