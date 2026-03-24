const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      const message = error.details.map((d) => d.message).join(', ');
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: message,
      });
    }
    req[property] = value;
    next();
  };
};

module.exports = validate;
