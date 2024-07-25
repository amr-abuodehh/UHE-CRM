const express = require("express");
const db = require("../db");
const bcrypt = require("bcryptjs");
const dayjs = require("dayjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
require("dotenv").config();
const {
  authenticateToken,
  authorizeAdmin,
  authorizeAdminOrManager,
} = require("../authMiddleware");

router.post("/token", (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) return res.sendStatus(401);

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(403);

    const accessToken = jwt.sign(
      {
        id: decoded.id,
        username: decoded.username,
        privilege: decoded.privilege,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "15m",
      }
    );

    res.json({ accessToken });
  });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const query =
      "SELECT id, username, privilege, password FROM users WHERE username=?";
    db.query(query, username, async (err, results) => {
      if (err) {
        console.error("Error retrieving user", err);
        return res.status(500).json({ message: "Database Error", error: err });
      }
      if (results.length === 0) {
        return res.status(401).json({ message: "User not found" });
      }
      const user = results[0];
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Incorrect Password" });
      }

      const accessToken = jwt.sign(
        { id: user.id, username: user.username, privilege: user.privilege },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "15min",
        }
      );

      const refreshToken = jwt.sign(
        { id: user.id, username: user.username, privilege: user.privilege },
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIn: "7d",
        }
      );

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        sameSite: "strict",
        secure: true,
      });

      res.json({ accessToken, refreshToken });
    });
  } catch (error) {
    console.error("Login error", error);
    res.status(500).json({ message: "Internal server error", error: error });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });
  res.sendStatus(204);
});

router.post(
  "/register",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    const { username, email, password, privilege } = req.body;
    const checkUserQuery = "SELECT * from users WHERE email=?";
    db.query(checkUserQuery, email, async (err, results) => {
      if (err) {
        console.error("Database error", err);
        return res.status(500).json({ message: "user already exists" });
      }
      if (results.length > 0) {
        return res.status(400).json({ message: "user already exists" });
      }

      const hashedpassword = await bcrypt.hash(password, 10);
      const currentDate = dayjs().tz("Asia/Dubai").format("YYYY-MM-DD");

      const query =
        "INSERT INTO users (username, email, password, privilege, date_created) VALUES (?,?,?,?,?)";
      const values = [username, email, hashedpassword, privilege, currentDate];
      db.query(query, values, (err, results) => {
        if (err) {
          console.error("error inserting user", err);
          return res.status(500).json({ message: "Database error" }, err);
        }
        res.status(200).json({ message: "user registered successfully" });
      });
    });
  }
);

router.get("/fetch_usernames", (req, res) => {
  const query = "SELECT username FROM users";
  db.query(query, (err, results) => {
    if (err) {
      console.error("error fetching usernames:", err);
      return res.status(500).json({ message: "Database error", error: err });
    }
    const usernames = results.map((row) => row.username);
    return res.status(200).json(usernames);
  });
});

module.exports = router;
