const express = require("express");
const db = require("../db");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const router = express.Router();

router.get("/fetch_pending_quotations", (req, res) => {
  const query = "SELECT * FROM quotations WHERE status=?";
  db.query(query, ["pending"], (err, results) => {
    if (err) {
      console.error("error fetching pending quotations", err);
      return res.status(500).json({ message: "database error" });
    }
    return res.status(200).json(results);
  });
});

router.get("/fetch_pending_orders", (req, res) => {
  const query = "SELECT * FROM orders WHERE STATUS=?";
  db.query(query, ["pending"], (err, results) => {
    if (err) {
      console.error("error fetching pending orders", err);
      return res.status(500).json({ message: "database error" });
    }
    return res.status(200).json(results);
  });
});

router.get("/fetch_task_info", (req, res) => {
  const username = req.headers["username"];
  const query = `
      SELECT 
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pendingTasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS finishedTasks
      FROM tasks
      WHERE assigned_to = ?
    `;

  db.query(query, [username], (err, results) => {
    if (err) {
      console.error("error fetching task info", err);
      return res.status(500).json({ message: "database error" });
    }
    const { pendingTasks, finishedTasks } = results[0];
    return res
      .status(200)
      .json({ pending: pendingTasks, finished: finishedTasks });
  });
});

module.exports = router;
