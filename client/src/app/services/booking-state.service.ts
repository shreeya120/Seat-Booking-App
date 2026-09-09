import { Injectable, signal } from '@angular/core';

export interface BookingDraft {
  locationCode: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  startDatetime: string;
  endDatetime: string;
  crossesMidnight: boolean;
  durationHours: number;
  seatId?: string;
  seatLabel?: string;
  zone?: string;
}

@Injectable({ providedIn: 'root' })
export class BookingStateService {
  draft = signal<BookingDraft | null>(null);
  lastBookingId = signal<string | null>(null);

  setDraft(d: BookingDraft) { this.draft.set(d); }
  clear() { this.draft.set(null); }

  computeDatetimes(bookingDate: string, startTime: string, endTime: string) {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const start = new Date(bookingDate);
    start.setHours(sh, sm, 0, 0);
    const end = new Date(bookingDate);
    end.setHours(eh, em, 0, 0);
    const crossesMidnight = endTime <= startTime;
    if (crossesMidnight) end.setDate(end.getDate() + 1);
    const durationHours = (end.getTime() - start.getTime()) / 3600000;
    return {
      startDatetime: start.toISOString(),
      endDatetime: end.toISOString(),
      crossesMidnight,
      durationHours: Math.round(durationHours * 10) / 10,
    };
  }
}
