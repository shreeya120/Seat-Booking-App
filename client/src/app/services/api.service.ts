import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Locations
  getLocations() { return this.http.get<any[]>(`${this.api}/locations`, { withCredentials: true }); }

  // Seats
  getAvailableSeats(location: string, startDatetime: string, endDatetime: string) {
    const params = new HttpParams().set('location', location).set('startDatetime', startDatetime).set('endDatetime', endDatetime);
    return this.http.get<any[]>(`${this.api}/seats/available`, { params, withCredentials: true });
  }

  // Bookings
  createBooking(data: any) { return this.http.post<any>(`${this.api}/bookings`, data, { withCredentials: true }); }
  getMyBookings() { return this.http.get<any[]>(`${this.api}/bookings/mine`, { withCredentials: true }); }
  getMyHistory() { return this.http.get<any[]>(`${this.api}/bookings/mine/history`, { withCredentials: true }); }
  cancelBooking(id: string, reason = '') { return this.http.delete(`${this.api}/bookings/${id}`, { body: { reason }, withCredentials: true }); }
  getBlockedDates(location?: string) {
    let params = new HttpParams();
    if (location) params = params.set('location', location);
    return this.http.get<any[]>(`${this.api}/bookings/blocked-dates`, { params, withCredentials: true });
  }
  getAllBlockedDates() {
    return this.http.get<any[]>(`${this.api}/bookings/blocked-dates`, { withCredentials: true });
  }

  // Notifications
  getNotifications() { return this.http.get<any[]>(`${this.api}/notifications`, { withCredentials: true }); }
  markNotificationRead(id: string) { return this.http.patch(`${this.api}/notifications/${id}/read`, {}, { withCredentials: true }); }
  markAllNotificationsRead() { return this.http.patch(`${this.api}/notifications/read-all`, {}, { withCredentials: true }); }
  getAnnouncements() { return this.http.get<any[]>(`${this.api}/notifications/announcements`, { withCredentials: true }); }

  // Admin
  adminGetUsers(params: any = {}) {
    let p = new HttpParams();
    Object.keys(params).forEach(k => { if (params[k]) p = p.set(k, params[k]); });
    return this.http.get<any>(`${this.api}/admin/users`, { params: p, withCredentials: true });
  }
  adminAddUser(data: any) { return this.http.post(`${this.api}/admin/users`, data, { withCredentials: true }); }
  adminDeactivateUser(id: string) { return this.http.patch(`${this.api}/admin/users/${id}/deactivate`, {}, { withCredentials: true }); }
  adminActivateUser(id: string) { return this.http.patch(`${this.api}/admin/users/${id}/activate`, {}, { withCredentials: true }); }
  adminDeleteUser(id: string) { return this.http.delete(`${this.api}/admin/users/${id}`, { withCredentials: true }); }
  adminUpdateUserLocations(id: string, allowedLocations: string[]) {
    return this.http.patch(`${this.api}/admin/users/${id}/locations`, { allowedLocations }, { withCredentials: true });
  }

  adminGetSeats(locationCode: string) { return this.http.get<any[]>(`${this.api}/admin/seats/${locationCode}`, { withCredentials: true }); }
  adminAddSeat(data: any) { return this.http.post(`${this.api}/admin/seats`, data, { withCredentials: true }); }
  adminBulkAddSeats(data: any) { return this.http.post(`${this.api}/admin/seats/bulk`, data, { withCredentials: true }); }
  adminBlockSeat(id: string, reason: string) { return this.http.patch(`${this.api}/admin/seats/${id}/block`, { reason }, { withCredentials: true }); }
  adminUnblockSeat(id: string) { return this.http.patch(`${this.api}/admin/seats/${id}/unblock`, {}, { withCredentials: true }); }
  adminDeleteSeat(id: string) { return this.http.delete(`${this.api}/admin/seats/${id}`, { withCredentials: true }); }

  adminGetLocations() { return this.http.get<any[]>(`${this.api}/admin/locations`, { withCredentials: true }); }
  adminAddLocation(data: any) { return this.http.post(`${this.api}/admin/locations`, data, { withCredentials: true }); }
  adminUpdateLocation(id: string, data: any) { return this.http.patch(`${this.api}/admin/locations/${id}`, data, { withCredentials: true }); }
  adminDeactivateLocation(id: string) { return this.http.patch(`${this.api}/admin/locations/${id}/deactivate`, {}, { withCredentials: true }); }

  adminGetBookings(params: any = {}) {
    let p = new HttpParams();
    Object.keys(params).forEach(k => { if (params[k]) p = p.set(k, params[k]); });
    return this.http.get<any>(`${this.api}/admin/bookings`, { params: p, withCredentials: true });
  }
  adminCancelBooking(id: string, reason = '') { return this.http.delete(`${this.api}/admin/bookings/${id}`, { body: { reason }, withCredentials: true }); }
  adminSwapSeat(id: string, newSeatId: string) { return this.http.patch(`${this.api}/admin/bookings/${id}/swap`, { newSeatId }, { withCredentials: true }); }

  adminGetBlockedDates() { return this.http.get<any[]>(`${this.api}/admin/blocked-dates`, { withCredentials: true }); }
  adminBlockDate(data: any) { return this.http.post(`${this.api}/admin/blocked-dates`, data, { withCredentials: true }); }
  adminUnblockDate(id: string) { return this.http.delete(`${this.api}/admin/blocked-dates/${id}`, { withCredentials: true }); }

  adminGetAnalytics(params: any = {}) {
    let p = new HttpParams();
    Object.keys(params).forEach(k => { if (params[k]) p = p.set(k, params[k]); });
    return this.http.get<any>(`${this.api}/admin/analytics`, { params: p, withCredentials: true });
  }

  adminGetAuditLog(params: any = {}) {
    let p = new HttpParams();
    Object.keys(params).forEach(k => { if (params[k]) p = p.set(k, params[k]); });
    return this.http.get<any>(`${this.api}/admin/audit-log`, { params: p, withCredentials: true });
  }

  adminGetAnnouncements(location?: string) {
    let p = new HttpParams();
    if (location) p = p.set('location', location);
    return this.http.get<any[]>(`${this.api}/admin/announcements`, { params: p, withCredentials: true });
  }
  adminCreateAnnouncement(data: any) { return this.http.post(`${this.api}/admin/announcements`, data, { withCredentials: true }); }
  adminDeleteAnnouncement(id: string) { return this.http.delete(`${this.api}/admin/announcements/${id}`, { withCredentials: true }); }

  adminTriggerSync() { return this.http.post(`${this.api}/admin/sync`, {}, { withCredentials: true }); }
  adminSyncStatus() { return this.http.get<any>(`${this.api}/admin/sync/status`, { withCredentials: true }); }
}
