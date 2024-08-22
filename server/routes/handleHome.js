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

router.get("/fetch_pending_quotations", async (req, res) => {
  try {
    const db = getMongoDB();
    const quotationsCollection = db.collection("quotations");

    // Fetch quotations with status 'pending'
    const pendingQuotations = await quotationsCollection
      .find({ status: "pending" })
      .toArray();

    return res.status(200).json(pendingQuotations);
  } catch (err) {
    console.error("Error fetching pending quotations:", err);
    return res
      .status(500)
      .json({ message: "Database Error", error: err.message });
  }
});

router.get("/fetch_pending_orders", async (req, res) => {
  try {
    const db = getMongoDB();
    const ordersCollection = db.collection("orders");

    // Fetch orders with status 'pending'
    const pendingOrders = await ordersCollection
      .find({ status: "pending" })
      .toArray();

    return res.status(200).json(pendingOrders);
  } catch (err) {
    console.error("Error fetching pending orders:", err);
    return res
      .status(500)
      .json({ message: "Database Error", error: err.message });
  }
});

router.get("/fetch_task_info", async (req, res) => {
  const username = req.headers["username"];

  try {
    const db = getMongoDB();
    const tasksCollection = db.collection("tasks");

    // Aggregate the task information for the given username
    const taskInfo = await tasksCollection
      .aggregate([
        { $match: { assigned_to: username } },
        {
          $group: {
            _id: null,
            pendingTasks: {
              $sum: {
                $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
              },
            },
            finishedTasks: {
              $sum: {
                $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
              },
            },
          },
        },
      ])
      .toArray();

    if (taskInfo.length === 0) {
      return res.status(200).json({ pending: 0, finished: 0 });
    }

    const { pendingTasks, finishedTasks } = taskInfo[0];

    return res
      .status(200)
      .json({ pending: pendingTasks, finished: finishedTasks });
  } catch (err) {
    console.error("Error fetching task info:", err);
    return res
      .status(500)
      .json({ message: "Database Error", error: err.message });
  }
});

module.exports = router;
