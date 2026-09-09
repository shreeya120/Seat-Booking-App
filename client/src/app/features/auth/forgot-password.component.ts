import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card card">
        <div class="auth-brand">
          <h1>Forgot Password</h1>
          <p class="text-muted text-sm">Enter your email to receive a reset OTP</p>
        </div>
        <form (ngSubmit)="onSubmit()" class="mt-4">
          <div class="form-group">
            <label>Email</label>
            <input type="email" [(ngModel)]="email" name="email" required placeholder="you&#64;ascendion.com">
          </div>
          <button type="submit" class="btn btn-primary w-full" [disabled]="loading()">
            {{ loading() ? 'Sending...' : 'Send OTP' }}
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
export class ForgotPasswordComponent {
  email = '';
  loading = signal(false);

  constructor(private auth: AuthService, private router: Router, private toast: ToastService) {}

  onSubmit() {
    this.loading.set(true);
    this.auth.forgotPassword(this.email).subscribe({
      next: () => {
        this.toast.info('If the email exists, an OTP has been sent.');
        this.router.navigate(['/reset-password'], { queryParams: { email: this.email } });
      },
      error: () => this.loading.set(false),
    });
  }
}
