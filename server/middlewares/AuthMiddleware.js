import jwt from "jsonwebtoken";          

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.warn("No Authorization header");
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    console.warn(" Malformed Authorization header");
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log(" authMiddleware decoded user:", decoded);
    req.user = decoded;
    next();
  } catch (err) {
    // console.error(" authMiddleware token verify error:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default authMiddleware;
