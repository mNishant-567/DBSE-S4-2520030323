import jwt from "jsonwebtoken";

export function authenticate(req, res, next) {
  const [scheme, token] = (req.get("authorization") || "").split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const claims = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: claims.sub,
      role: claims.role,
      patientId: claims.patientId || null,
      doctorId: claims.doctorId || null
    };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    return next();
  };
}