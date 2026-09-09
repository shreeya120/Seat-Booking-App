const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { auth, adminOnly } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { addSeatSchema, bulkSeatSchema, locationSchema, blockDateSchema, announcementSchema } = require('../validations/schemas');

router.use(auth, adminOnly);

// Users
router.get('/users', ctrl.getUsers);
router.post('/users', ctrl.addUser);
router.patch('/users/:id/activate', ctrl.activateUser);
router.patch('/users/:id/deactivate', ctrl.deactivateUser);
router.delete('/users/:id', ctrl.deleteUser);
router.patch('/users/:id/locations', ctrl.updateUserLocations);

// Seats
router.get('/seats/:locationCode', ctrl.getSeats);
router.post('/seats', validate(addSeatSchema), ctrl.addSeat);
router.post('/seats/bulk', validate(bulkSeatSchema), ctrl.bulkAddSeats);
router.patch('/seats/:id/block', ctrl.blockSeat);
router.patch('/seats/:id/unblock', ctrl.unblockSeat);
router.delete('/seats/:id', ctrl.deleteSeat);

// Locations
router.get('/locations', ctrl.getLocations);
router.post('/locations', validate(locationSchema), ctrl.addLocation);
router.patch('/locations/:id', ctrl.updateLocation);
router.patch('/locations/:id/deactivate', ctrl.deactivateLocation);

// Bookings
router.get('/bookings', ctrl.getAllBookings);
router.delete('/bookings/:id', ctrl.cancelBooking);
router.patch('/bookings/:id/swap', ctrl.swapSeat);

// Block Dates
router.get('/blocked-dates', ctrl.getBlockedDates);
router.post('/blocked-dates', validate(blockDateSchema), ctrl.blockDate);
router.delete('/blocked-dates/:id', ctrl.unblockDate);

// Analytics & Audit
router.get('/analytics', ctrl.analytics);
router.get('/audit-log', ctrl.auditLog);

// Announcements
router.get('/announcements', ctrl.getAnnouncements);
router.post('/announcements', validate(announcementSchema), ctrl.createAnnouncement);
router.delete('/announcements/:id', ctrl.deleteAnnouncement);

// Notifications (admin viewing own)
router.get('/notifications', ctrl.getNotifications);
router.patch('/notifications/:id/read', ctrl.markNotificationRead);

// OneDrive Sync
router.post('/sync', ctrl.triggerSync);
router.get('/sync/status', ctrl.syncStatus);

module.exports = router;
