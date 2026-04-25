const { ZodError } = require('zod');

function validate(schema) {
  return (req, res, next) => {
    try {
      const result = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      req.validated = result;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: {
            message: 'Validation error',
            issues: err.issues
          }
        });
      }
      next(err);
    }
  };
}

module.exports = { validate };

