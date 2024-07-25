const express = require("express");
const db = require("../db");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const router = express.Router();

router.post("/create", (req, res) => {
  const { task, details, client, deadline, assigned_to } = req.body;
  const username = req.headers["username"];
  try {
    const query =
      "INSERT INTO tasks(task,details,deadline,assigned_to,client,created_by) VALUES(?,?,?,?,?,?)";
    const values = [task, details, deadline, assigned_to, client, username];
    db.query(query, values, (err, results) => {
      if (err) {
        console.log("error creating new task", err);
        return res.status(500).json({ message: "Database Error", error: err });
      }
      return res.status(200).json({ message: "New task Created Successfully" });
    });
  } catch (error) {
    console.error("error creating new task");
    return res.status(500).json({ message: "Database Error", error: error });
  }
});
router.get("/fetch", (req, res) => {
  try {
    const { location, startDate, endDate } = req.query;
    let query = "SELECT * FROM tasks WHERE 1=1";
    const user = JSON.parse(req.headers["user"]);
    const queryParams = [];

    if (location) {
      query += " AND location=?";
      queryParams.push(location);
    }

    if (startDate && endDate) {
      const formattedStartDate = dayjs(startDate).format("YYYY-MM-DD");
      const formattedEndDate = dayjs(endDate).format("YYYY-MM-DD");
      query += " AND date_created BETWEEN ? AND ?";
      queryParams.push(formattedStartDate, formattedEndDate);
    } else if (startDate) {
      const formattedStartDate = dayjs(startDate).format("YYYY-MM-DD");
      query += " AND date_created >= ?";
      queryParams.push(formattedStartDate);
    } else if (endDate) {
      const formattedEndDate = dayjs(endDate).format("YYYY-MM-DD");
      query += " AND date_created <= ?";
      queryParams.push(formattedEndDate);
    }

    if (user.privilege !== "admin" && user.privilege !== "manager") {
      query += " AND assigned_to=?";
      queryParams.push(user.username);
    }

    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Database error", error: err });
      }

      const convertedResults = results.map((task) => {
        const dateCreated = dayjs
          .utc(task.date_created)
          .tz("Asia/Dubai")
          .format("YYYY-MM-DD");
        const deadline = dayjs
          .utc(task.deadline)
          .tz("Asia/Dubai")
          .format("YYYY-MM-DD");
        return {
          ...task,
          date_created: dateCreated,
          deadline: deadline,
        };
      });

      res.status(200).json(convertedResults);
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.delete("/delete/:id", (req, res) => {
  const { id } = req.params;
  try {
    const query = "DELETE FROM tasks WHERE id=?";
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error("error deleting task", err);
        return res.status(500).json({ message: "Database Error", error: err });
      }
      return res
        .status(201)
        .json({ message: `Task with ID: ${id} Deleted successfully` });
    });
  } catch (error) {
    console.error("error deleting task", error);
    return res
      .status(500)
      .json({ message: "Database error", error: error.message });
  }
});

router.put("/update/:id", (req, res) => {
  const {
    task,
    client,
    details,
    deadline,
    assigned_to,
    employee_comments,
    status,
  } = req.body;
  const { id } = req.params;
  const query =
    "UPDATE tasks SET task=?, client=?, details=?, assigned_to=?, employee_comments=?, status=?, deadline=? WHERE id=?";
  const values = [
    task,
    client,
    details,
    assigned_to,
    employee_comments,
    status,
    deadline,
    id,
  ];
  try {
    db.query(query, values, (err, results) => {
      if (err) {
        console.error("error updating task", err);
        return res.status(500).json({ message: "database error", error: err });
      }
      return res
        .status(200)
        .json({ message: `Task with ID:${id} Successfully Updated` });
    });
  } catch (error) {
    console.error("error updating task", error);
    return res.status(500).json({ message: "Database Error", error });
  }
});

module.exports = router;
