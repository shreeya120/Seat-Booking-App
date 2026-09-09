const { z } = require('zod');

const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().regex(passwordRegex, 'Min 8 chars, 1 uppercase, 1 number, 1 special char'),
  employeeId: z.string().min(1),
  primaryLocation: z.string().min(2).max(5),
  department: z.string().optional().default(''),
});

const loginSchema = z.object({
  email: z.string().min(3),
  password: z.string().min(1),
});

const otpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

const forgotPasswordSchema = z.object({ email: z.string().email() });

const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().regex(passwordRegex),
});

const bookingSchema = z.object({
  seatId: z.string().min(1),
  locationCode: z.string().min(2),
  bookingDate: z.string().min(1),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

const addSeatSchema = z.object({
  locationCode: z.string().min(2),
  seatNumber: z.number().int().positive(),
  seatLabel: z.string().min(1),
  zone: z.string().optional().default(''),
  amenities: z.array(z.string()).optional().default([]),
});

const bulkSeatSchema = z.object({
  locationCode: z.string().min(2),
  startNumber: z.number().int().positive(),
  endNumber: z.number().int().positive(),
  zone: z.string().optional().default(''),
});

const locationSchema = z.object({
  code: z.string().min(2).max(5),
  name: z.string().min(1),
  address: z.string().optional().default(''),
});

const blockDateSchema = z.object({
  locationCode: z.string().min(1),
  blockedDate: z.string().min(1),
  reason: z.string().optional().default(''),
});

const announcementSchema = z.object({
  locationCode: z.string().min(1),
  message: z.string().min(1),
});

module.exports = {
  registerSchema, loginSchema, otpSchema, forgotPasswordSchema,
  resetPasswordSchema, bookingSchema, addSeatSchema, bulkSeatSchema,
  locationSchema, blockDateSchema, announcementSchema,
};
