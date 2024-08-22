const express = require("express");
const db = require("../db");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const { getMongoDB } = require("../db");

dayjs.extend(utc);
dayjs.extend(timezone);

const router = express.Router();
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

router.post("/create", async (req, res) => {
  const { task, details, client, deadline, assigned_to } = req.body;
  const username = req.headers["username"];

  try {
    const db = getMongoDB();
    const tasksCollection = db.collection("tasks");

    // Generate a new ref_number using the sequence function
    const ref_number = await getNextSequence(db, "tasks");

    // Create the task document
    const newTask = {
      ref_number, // Generated sequence number
      task,
      details,
      deadline,
      assigned_to,
      client,
      created_by: username,
      status: "pending", // Default value
      employee_comments: "", // Default value
      created_at: new Date(), // Optionally add a created_at timestamp
    };

    // Insert the new task into the collection
    const result = await tasksCollection.insertOne(newTask);

    if (result) {
      return res.status(200).json({ message: "New task Created Successfully" });
    } else {
      return res.status(500).json({ message: "Failed to create new task" });
    }
  } catch (error) {
    console.error("Error creating new task:", error);
    return res
      .status(500)
      .json({ message: "Database Error", error: error.message });
  }
});

router.get("/fetch", async (req, res) => {
  try {
    const { location, startDate, endDate } = req.query;
    const user = JSON.parse(req.headers["user"]);

    const db = getMongoDB();
    const tasksCollection = db.collection("tasks");

    // Build the query object
    const query = {};

    if (location) {
      query.location = location;
    }

    if (startDate && endDate) {
      const formattedStartDate = new Date(startDate);
      const formattedEndDate = new Date(endDate);
      query.date_created = { $gte: formattedStartDate, $lte: formattedEndDate };
    } else if (startDate) {
      const formattedStartDate = new Date(startDate);
      query.date_created = { $gte: formattedStartDate };
    } else if (endDate) {
      const formattedEndDate = new Date(endDate);
      query.date_created = { $lte: formattedEndDate };
    }

    if (user.privilege !== "admin" && user.privilege !== "manager") {
      query.assigned_to = user.username;
    }

    // Fetch tasks from MongoDB
    const results = await tasksCollection.find(query).toArray();

    // Convert dates to the desired format
    const convertedResults = results.map((task) => {
      return {
        ...task,
        date_created: dayjs
          .utc(task.date_created)
          .tz("Asia/Dubai")
          .format("YYYY-MM-DD"),
        deadline: dayjs
          .utc(task.deadline)
          .tz("Asia/Dubai")
          .format("YYYY-MM-DD"),
      };
    });

    res.status(200).json(convertedResults);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;
  const refNumber = parseInt(id, 10); // Ensure id is a number

  try {
    const db = getMongoDB();
    const tasksCollection = db.collection("tasks");

    // Delete the task document
    const result = await tasksCollection.deleteOne({ ref_number: refNumber });

    if (result.deletedCount === 1) {
      return res.status(200).json({
        message: `Task with ref_number ${refNumber} deleted successfully`,
      });
    } else {
      console.log("Deletion failed. Result:", result);
      return res.status(404).json({
        message: `Task with ref_number ${refNumber} not found`,
      });
    }
  } catch (error) {
    console.error("Error deleting task:", error);
    return res.status(500).json({
      message: "Database Error",
      error: error.message,
    });
  }
});

router.put("/update/:id", async (req, res) => {
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
  const refNumber = parseInt(id, 10); // Ensure id is a number

  try {
    const db = getMongoDB();
    const tasksCollection = db.collection("tasks");

    // Update the task document
    const result = await tasksCollection.updateOne(
      { ref_number: refNumber }, // Match by ref_number
      {
        $set: {
          task: task || "", // Default to empty string if not provided
          client: client || "", // Default to empty string if not provided
          details: details || "", // Default to empty string if not provided
          assigned_to: assigned_to || "", // Default to empty string if not provided
          employee_comments: employee_comments || "", // Default to empty string if not provided
          status: status || "pending", // Default to "pending" if not provided
          deadline: deadline || null, // Default to null if not provided
        },
      }
    );

    if (result.matchedCount === 1) {
      return res.status(200).json({
        message: `Task with ref_number:${refNumber} successfully updated`,
      });
    } else {
      return res.status(404).json({
        message: `Task with ref_number:${refNumber} not found`,
      });
    }
  } catch (error) {
    console.error("Error updating task:", error);
    return res.status(500).json({
      message: "Database Error",
      error: error.message,
    });
  }
});

module.exports = router;
