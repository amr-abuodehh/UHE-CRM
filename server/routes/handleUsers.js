const express = require("express");
const db = require("../db");
const bcrypt = require("bcryptjs");
const dayjs = require("dayjs");
const jwt = require("jsonwebtoken");
const { getMongoDB } = require("../db");
const router = express.Router();
require("dotenv").config();
const {
  authenticateToken,
  authorizeAdmin,
  authorizeAdminOrManager,
} = require("../middleware/authMiddleware");
const getNextSequence = async (db, name) => {
  try {
    let result = await db.collection("sequences").findOne({ _id: name });

    if (!result) {
      await db.collection("sequences").insertOne({ _id: name, seq: 1 });
      result = await db.collection("sequences").findOne({ _id: name });
    }
    await db
      .collection("sequences")
      .updateOne({ _id: name }, { $inc: { seq: 1 } });
    const updatedResult = await db
      .collection("sequences")
      .findOne({ _id: name });

    if (updatedResult && typeof updatedResult.seq === "number") {
      return updatedResult.seq;
    } else {
      throw new Error(
        `Failed to retrieve sequence for ${name}. Result is ${JSON.stringify(
          updatedResult
        )}`
      );
    }
  } catch (error) {
    console.error("Error in getNextSequence:", error);
    throw error;
  }
};

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
    const db = getMongoDB();
    const usersCollection = db.collection("users");

    // Retrieve the user from MongoDB
    const user = await usersCollection.findOne(
      { username },
      { projection: { password: 1, username: 1, privilege: 1, _id: 1 } }
    );

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Compare the password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Incorrect Password" });
    }

    // Generate JWT tokens
    const accessToken = jwt.sign(
      {
        id: user._id.toString(),
        username: user.username,
        privilege: user.privilege,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15min" }
    );

    const refreshToken = jwt.sign(
      {
        id: user._id.toString(),
        username: user.username,
        privilege: user.privilege,
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    // Set the refresh token in a cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      sameSite: "strict",
      secure: true,
    });

    // Send the tokens as response
    res.json({ accessToken, refreshToken });
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
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

    try {
      const db = getMongoDB();
      const usersCollection = db.collection("users");
      const sequencesCollection = db.collection("sequences");

      // Check if the user already exists
      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Generate a new ref_number using the sequence function
      const refNumber = await getNextSequence(db, "users");

      // Create the new user document
      const hashedPassword = await bcrypt.hash(password, 10);
      const currentDate = dayjs().tz("Asia/Dubai").format("YYYY-MM-DD");

      const newUser = {
        ref_number: `USER-${refNumber}`, // Format ref_number as USER-1
        username,
        email,
        password: hashedPassword,
        privilege,
        date_created: currentDate,
      };

      // Insert the new user into the collection
      await usersCollection.insertOne(newUser);

      res.status(200).json({ message: "User registered successfully" });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({ message: "Database error", error: error.message });
    }
  }
);
router.get("/fetch_usernames", async (req, res) => {
  try {
    const db = getMongoDB();
    const usersCollection = db.collection("users");

    // Fetch usernames from MongoDB
    const users = await usersCollection
      .find({}, { projection: { username: 1, _id: 0 } })
      .toArray();
    const usernames = users.map((user) => user.username);

    return res.status(200).json(usernames);
  } catch (error) {
    console.error("Error fetching usernames:", error);
    return res
      .status(500)
      .json({ message: "Database error", error: error.message });
  }
});

module.exports = router;
