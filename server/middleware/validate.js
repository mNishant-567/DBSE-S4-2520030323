export function validate(schema, source = "body") {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: false,
      convert: true
    });
    if (error) return next(error);
    req[source] = value;
    return next();
  };
}