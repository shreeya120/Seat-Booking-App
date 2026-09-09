const router = require('express').Router();
const { auth } = require('../middleware/auth');
const Notification = require('../models/Notification');
const Announcement = require('../models/Announcement');

router.get('/', auth, async (req, res, next) => {
  try { res.json(await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50)); } catch (err) { next(err); }
});

router.patch('/:id/read', auth, async (req, res, next) => {
  try { await Notification.findByIdAndUpdate(req.params.id, { read: true }); res.json({ message: 'Read' }); } catch (err) { next(err); }
});

router.patch('/read-all', auth, async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    res.json({ message: 'All marked as read' });
  } catch (err) { next(err); }
});

router.get('/announcements', auth, async (req, res, next) => {
  try {
    const locs = req.user.allowedLocations || [req.user.primaryLocation];
    res.json(await Announcement.find({ isActive: true, $or: [{ locationCode: { $in: locs } }, { locationCode: 'ALL' }] }).sort({ createdAt: -1 }));
  } catch (err) { next(err); }
});

module.exports = router;
