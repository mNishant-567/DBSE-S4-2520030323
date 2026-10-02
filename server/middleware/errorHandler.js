export default function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error.isJoi) {
    return res.status(400).json({
      error: "Validation failed",
      details: error.details.map(detail => detail.message)
    });
  }
  if (error.name === "CastError" || error.name === "ValidationError") {
    return res.status(400).json({ error: error.message });
  }
  if (error.code === "23505" || error.code === 11000) {
    return res.status(409).json({ error: "A record with that value already exists" });
  }
  if (error.code === "23503" || error.code === "23514" || error.code === "22P02") {
    return res.status(400).json({ error: "A referenced record is invalid" });
  }

  console.error(error);
  return res.status(error.status || 500).json({
    error: error.status ? error.message : "Internal server error"
  });
}