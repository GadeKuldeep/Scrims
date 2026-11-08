export function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params
      });

      if (!parsed.success) {
        const errorMessages = parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`);
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errorMessages
        });
      }

      // Assign sanitized data
      req.validated = parsed.data;
      next();
    } catch (err) {
      next(err);
    }
  };
}
