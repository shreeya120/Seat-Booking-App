const router = require('express').Router();
const Location = require('../models/Location');

router.get('/', async (_req, res, next) => {
  try { res.json(await Location.find({ isActive: true })); } catch (err) { next(err); }
});

module.exports = router;
