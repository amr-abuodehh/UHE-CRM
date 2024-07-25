const express = require("express");
const db = require("../db");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const router = express.Router();

router.post("/create", (req, res) => {
  const { name, designation, department, from_time, to_time, reason } =
    req.body;
  try {
    insertQuery =
      "INSERT INTO exit_forms(name,designation,department,from_time,to_time,reason) VALUES (?,?,?,?,?,?)";
    insertValues = [name, designation, department, from_time, to_time, reason];

    db.query(insertQuery, insertValues, (err, results) => {
      if (err) {
        console.error("error creating exit form", err);
        return res.status(500).json({ message: "Database Error", error: err });
      }
      return res
        .status(200)
        .json({ message: "Exit Form Successfully Created" });
    });
  } catch (error) {
    console.error("error creating exit form", error);
    return res.status(500).json({ message: "Database Error", error: error });
  }
});

router.get("/fetch", (req, res) => {
  const { location, startDate, endDate } = req.query;
  let query = "SELECT * FROM exit_forms WHERE 1=1";
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

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database error", error: err });
    }

    const convertedResults = results.map((form) => {
      return {
        ...form,
        created_at: dayjs.utc(form.created_at).format("YYYY-MM-DD"),
        hr_acknowledgment_date: form.hr_acknowledgment_date
          ? dayjs.utc(form.hr_acknowledgment_date).format("YYYY-MM-DD")
          : null,
      };
    });

    res.status(200).json(convertedResults);
  });
});

router.put("/update/:id", (req, res) => {
  const { id } = req.params;
  const { hr_acknowledgment_date, hr_approval, remarks } = req.body;
  //Update existing information Query

  const query =
    "UPDATE exit_forms SET  hr_acknowledgment_date=?, hr_approval=?, remarks=? WHERE id=?";
  const values = [hr_acknowledgment_date, hr_approval, remarks, id];

  db.query(query, values, (err, results) => {
    if (err) {
      console.error("Error updating supplier", err);
      return res.status(500).json({ message: "Database Error", error: err });
    }
    return res
      .status(200)
      .json({ message: `exit form with id:${id} has been ${hr_approval}` });
  });
});

router.delete("/delete/:id", (req, res) => {
  const { id } = req.params;

  try {
    const query = "DELETE FROM exit_forms WHERE id=?";
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error("Error deleting form", err);
        return res.status(500).json({ message: "Database Error", error: err });
      }
      res
        .status(200)
        .json({ message: `form with ID ${id} deleted successfully` });
    });
  } catch (error) {
    console.error("error deleting form", error);
    return res
      .status(500)
      .json({ message: "Database Error", error: error.message });
  }
});

///////////////////////////////

router.post("/create_leave", (req, res) => {
  const {
    name,
    designation,
    department,
    employee_number,
    joining_date,
    type_of_leave,
    start_date,
    return_date,
    number_of_days,
  } = req.body;
  try {
    insertQuery =
      "INSERT INTO leave_forms(name,designation,department,employee_number,joining_date,type_of_leave,start_date,return_date,number_of_days) VALUES (?,?,?,?,?,?,?,?,?)";
    insertValues = [
      name,
      designation,
      department,
      employee_number,
      joining_date,
      type_of_leave,
      start_date,
      return_date,
      number_of_days,
    ];

    db.query(insertQuery, insertValues, (err, results) => {
      if (err) {
        console.error("error creating leave form", err);
        return res.status(500).json({ message: "Database Error", error: err });
      }
      return res
        .status(200)
        .json({ message: "Leave Form Successfully Created" });
    });
  } catch (error) {
    console.error("error creating leave form", error);
    return res.status(500).json({ message: "Database Error", error: error });
  }
});

router.get("/fetch_leave", (req, res) => {
  const { location, startDate, endDate } = req.query;
  let query = "SELECT * FROM leave_forms WHERE 1=1";
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

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database error", error: err });
    }

    const convertedResults = results.map((form) => {
      return {
        ...form,
        joining_date: dayjs.utc(form.joining_date).format("YYYY-MM-DD"),
        start_date: dayjs.utc(form.start_date).format("YYYY-MM-DD"),
        return_date: dayjs.utc(form.return_date).format("YYYY-MM-DD"),
        created_at: dayjs.utc(form.created_at).format("YYYY-MM-DD"),
      };
    });

    res.status(200).json(convertedResults);
  });
});

router.put("/update_leave/:id", (req, res) => {
  const { id } = req.params;
  const { leave_balance, hr_approval, manager_approval, comments } = req.body;
  //Update existing information Query

  const query =
    "UPDATE leave_forms SET  leave_balance=?, hr_approval=?, comments=?, manager_approval=?  WHERE id=?";
  const values = [leave_balance, hr_approval, comments, manager_approval, id];

  db.query(query, values, (err, results) => {
    if (err) {
      console.error("Error updating form", err);
      return res.status(500).json({ message: "Database Error", error: err });
    }
    return res
      .status(200)
      .json({ message: `leave form with id:${id} has been ${hr_approval}` });
  });
});
router.delete("/delete_leave/:id", (req, res) => {
  const { id } = req.params;

  try {
    const query = "DELETE FROM leave_forms WHERE id=?";
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error("Error deleting form", err);
        return res.status(500).json({ message: "Database Error", error: err });
      }
      res
        .status(200)
        .json({ message: `form with ID ${id} deleted successfully` });
    });
  } catch (error) {
    console.error("error deleting form", error);
    return res
      .status(500)
      .json({ message: "Database Error", error: error.message });
  }
});

module.exports = router;
