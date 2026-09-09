import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { adminGuard } from './core/admin.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent) },
  { path: 'verify-otp', loadComponent: () => import('./features/auth/verify-otp.component').then(m => m.VerifyOtpComponent) },
  { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password.component').then(m => m.ForgotPasswordComponent) },
  { path: 'reset-password', loadComponent: () => import('./features/auth/reset-password.component').then(m => m.ResetPasswordComponent) },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
      { path: 'book', loadComponent: () => import('./features/booking/book.component').then(m => m.BookComponent) },
      { path: 'book/seats', loadComponent: () => import('./features/booking/seat-grid.component').then(m => m.SeatGridComponent) },
      { path: 'book/confirm', loadComponent: () => import('./features/booking/confirm.component').then(m => m.ConfirmComponent) },
      { path: 'book/success', loadComponent: () => import('./features/booking/success.component').then(m => m.SuccessComponent) },
      { path: 'my-bookings', loadComponent: () => import('./features/my-bookings/my-bookings.component').then(m => m.MyBookingsComponent) },
      { path: 'notifications', loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent) },
      { path: 'profile', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },
      {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          { path: '', loadComponent: () => import('./features/admin/dashboard.component').then(m => m.AdminDashboardComponent) },
          { path: 'locations', loadComponent: () => import('./features/admin/locations.component').then(m => m.AdminLocationsComponent) },
          { path: 'seats/:locationCode', loadComponent: () => import('./features/admin/seats.component').then(m => m.AdminSeatsComponent) },
          { path: 'users', loadComponent: () => import('./features/admin/users.component').then(m => m.AdminUsersComponent) },
          { path: 'user/:id/locations', loadComponent: () => import('./features/admin/user-locations.component').then(m => m.UserLocationsComponent) },
          { path: 'block-dates', loadComponent: () => import('./features/admin/block-dates.component').then(m => m.BlockDatesComponent) },
          { path: 'audit-log', loadComponent: () => import('./features/admin/audit-log.component').then(m => m.AuditLogComponent) },
          { path: 'announcements', loadComponent: () => import('./features/admin/announcements.component').then(m => m.AnnouncementsComponent) },
          { path: 'sync', loadComponent: () => import('./features/admin/sync.component').then(m => m.SyncComponent) },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
