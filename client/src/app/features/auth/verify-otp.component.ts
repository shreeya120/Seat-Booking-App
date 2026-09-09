import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card card">
        <div class="auth-brand">
          <span class="material-icons-outlined" style="font-size:36px;color:var(--accent)">verified</span>
          <h1>Verify Your Email</h1>
          <p class="text-muted text-sm">Enter the 6-digit OTP sent to {{ email }}</p>
        </div>
        <form (ngSubmit)="onVerify()" class="mt-4">
          <div class="form-group">
            <label>OTP Code</label>
            <input [(ngModel)]="otp" name="otp" maxlength="6" placeholder="000000" style="text-align:center;font-size:24px;letter-spacing:8px" required>
          </div>
          @if (error()) { <p class="form-error">{{ error() }}</p> }
          <button type="submit" class="btn btn-primary w-full" [disabled]="loading()">
            {{ loading() ? 'Verifying...' : 'Verify' }}
          </button>
        </form>
        <div class="auth-links mt-4">
          <button class="btn-outline btn-sm" (click)="onResend()" [disabled]="resending()">
            {{ resending() ? 'Sending...' : 'Resend OTP' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px; background: var(--bg); }
    .auth-card { max-width: 400px; width: 100%; }
    .auth-brand { text-align: center; }
    .auth-brand h1 { font-size: 22px; margin-top: 8px; }
    .auth-links { text-align: center; }
  `],
})
export class VerifyOtpComponent implements OnInit {
  email = '';
  otp = '';
  loading = signal(false);
  resending = signal(false);
  error = signal('');

  constructor(private auth: AuthService, private route: ActivatedRoute, private router: Router, private toast: ToastService) {}

  ngOnInit() {
    this.email = this.route.snapshot.queryParams['email'] || '';
    const devOtp = this.route.snapshot.queryParams['devOtp'];
    if (devOtp) {
      this.otp = devOtp;
      this.toast.info('Dev mode: OTP auto-filled');
    }
  }

  onVerify() {
    this.loading.set(true);
    this.error.set('');
    this.auth.verifyOtp(this.email, this.otp).subscribe({
      next: () => { this.toast.success('Email verified! Please login.'); this.router.navigate(['/login']); },
      error: (err) => { this.error.set(err.error?.error || 'Verification failed'); this.loading.set(false); },
    });
  }

  onResend() {
    this.resending.set(true);
    this.auth.resendOtp(this.email).subscribe({
      next: () => { this.toast.info('OTP resent'); this.resending.set(false); },
      error: () => { this.resending.set(false); },
    });
  }
}
