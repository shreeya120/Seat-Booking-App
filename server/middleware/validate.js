const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Validation failed', details: result.error.flatten().fieldErrors });
  }
  req.validated = result.data;
  next();
};

const errorHandler = (err, req, res, _next) => {
  console.error(err.stack);
  if (err.code === 11000) return res.status(409).json({ error: 'Duplicate entry' });
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
};

module.exports = { validate, errorHandler };
