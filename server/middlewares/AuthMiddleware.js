import jwt from "jsonwebtoken";          

const authMiddleware = (req, res, next) => {
  const token = req.cookies.token; // only i can access the token through js in the server not the client side 
  if (!token) return res.status(401).json({ message: "Unauthorized" }); // sending the error response

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // this verify method checks the token validityand if valid it returnes the decoded payload 
    req.user = decoded; // storing the decoded objecy in the request object so that it can be accessed in the next middleware or route handler
    next();
  } catch (err) {
    console.log("JWT invalid:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
};


export default authMiddleware;
