require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Location = require('./models/Location');
const Seat = require('./models/Seat');

const locations = [
  { code: 'HYD', name: 'Hyderabad', address: 'Ascendion Hyderabad Office' },
  { code: 'BLR', name: 'Bangalore', address: 'Ascendion Bangalore Office' },
  { code: 'CHN', name: 'Chennai', address: 'Ascendion Chennai Office' },
  { code: 'PNE', name: 'Pune', address: 'Ascendion Pune Office' },
  { code: 'VDR', name: 'Vadodara', address: 'Ascendion Vadodara Office' },
];

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Seed locations
  for (const loc of locations) {
    await Location.findOneAndUpdate({ code: loc.code }, loc, { upsert: true });
  }
  console.log('Locations seeded');

  // Seed admin user
  const adminExists = await User.findOne({ email: 'admin@ascendion.com' });
  if (!adminExists) {
    await User.create({
      name: 'Admin User', email: 'admin@ascendion.com', passwordHash: 'Admin@1234',
      role: 'admin', employeeId: 'ADM001', primaryLocation: 'HYD',
      allowedLocations: ['HYD', 'BLR', 'CHN', 'PNE', 'VDR'],
      isActive: true, isEmailVerified: true,
    });
    console.log('Admin created (admin@ascendion.com / Admin@1234)');
  }

  // Seed employee user
  const empExists = await User.findOne({ email: 'employee@ascendion.com' });
  if (!empExists) {
    await User.create({
      name: 'Test Employee', email: 'employee@ascendion.com', passwordHash: 'Test@1234',
      role: 'employee', employeeId: 'EMP001', primaryLocation: 'HYD',
      allowedLocations: ['HYD'], department: 'Engineering',
      isActive: true, isEmailVerified: true,
    });
    console.log('Employee created (employee@ascendion.com / Test@1234)');
  }

  // Seed 10 seats per location
  for (const loc of locations) {
    const existing = await Seat.countDocuments({ locationCode: loc.code });
    if (existing === 0) {
      const seats = Array.from({ length: 10 }, (_, i) => ({
        locationCode: loc.code, seatNumber: i + 1,
        seatLabel: `${loc.code}-${i + 1}`, zone: 'Zone A',
      }));
      await Seat.insertMany(seats);
      await Location.findOneAndUpdate({ code: loc.code }, { totalSeats: 10 });
    }
  }
  console.log('Seats seeded');

  await mongoose.disconnect();
  console.log('Seed complete');
};

seed().catch(console.error);
