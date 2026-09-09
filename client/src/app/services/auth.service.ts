import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'employee' | 'admin';
  primaryLocation: string;
  allowedLocations: string[];
  employeeId?: string;
  department?: string;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = environment.apiUrl + '/auth';
  private _user = signal<User | null>(null);

  user = this._user.asReadonly();
  isLoggedIn = computed(() => !!this._user());
  isAdmin = computed(() => this._user()?.role === 'admin');

  constructor(private http: HttpClient, private router: Router) {}

  init() {
    return this.http.get<{ user: User }>(`${this.api}/me`, { withCredentials: true }).pipe(
      tap(res => this._user.set(res.user)),
      catchError(() => { this._user.set(null); return of(null); })
    );
  }

  register(data: any) {
    return this.http.post(`${this.api}/register`, data, { withCredentials: true });
  }

  verifyOtp(email: string, otp: string) {
    return this.http.post(`${this.api}/verify-otp`, { email, otp }, { withCredentials: true });
  }

  login(email: string, password: string) {
    return this.http.post<{ user: User }>(`${this.api}/login`, { email, password }, { withCredentials: true }).pipe(
      tap(res => this._user.set(res.user))
    );
  }

  logout() {
    return this.http.post(`${this.api}/logout`, {}, { withCredentials: true }).pipe(
      tap(() => { this._user.set(null); this.router.navigate(['/login']); })
    );
  }

  forgotPassword(email: string) {
    return this.http.post(`${this.api}/forgot-password`, { email }, { withCredentials: true });
  }

  resetPassword(email: string, otp: string, newPassword: string) {
    return this.http.post(`${this.api}/reset-password`, { email, otp, newPassword }, { withCredentials: true });
  }

  resendOtp(email: string) {
    return this.http.post(`${this.api}/resend-otp`, { email }, { withCredentials: true });
  }
}
