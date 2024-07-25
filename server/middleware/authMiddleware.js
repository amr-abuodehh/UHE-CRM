const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
}
function authorizeAdmin(req, res, next) {
  if (req.user && req.user.privilege === "admin") {
    next();
  } else {
    res.sendStatus(403);
  }
}

function authorizeAdminOrManager(req, res, next) {
  if (
    req.user &&
    (req.user.privilege === "admin" || req.user.privilege === "manager")
  ) {
    next();
  } else {
    res.sendStatus(403);
  }
}

module.exports = {
  authenticateToken,
  authorizeAdmin,
  authorizeAdminOrManager,
};
