const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const sendEmail = async (to, subject, html) => {
  await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
};

const otpEmail = (otp, purpose) => `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e0e0e0;border-radius:8px">
    <h2 style="color:#1a237e">Ascendion Seat Booking</h2>
    <p>Your OTP for <strong>${purpose === 'email_verification' ? 'account verification' : 'password reset'}</strong>:</p>
    <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:16px;background:#f5f5f5;border-radius:8px">${otp}</div>
    <p style="color:#666;font-size:13px">Expires in 10 minutes. Do not share this code.</p>
  </div>`;

const bookingConfirmEmail = (b) => `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e0e0e0;border-radius:8px">
    <h2 style="color:#1a237e">Booking Confirmed ✅</h2>
    <p><strong>Location:</strong> ${b.locationCode}</p>
    <p><strong>Seat:</strong> ${b.seatLabel}</p>
    <p><strong>Date:</strong> ${b.bookingDate}</p>
    <p><strong>Time:</strong> ${b.startTime} → ${b.endTime}${b.crossesMidnight ? ' (next day)' : ''}</p>
    <p><strong>Duration:</strong> ${b.durationHours} hours</p>
  </div>`;

module.exports = { sendEmail, otpEmail, bookingConfirmEmail };
