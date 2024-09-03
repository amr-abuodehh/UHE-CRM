const express = require("express");
const db = require("../db");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const { getMongoDB } = require("../db");
const uploadLeaveForms = require("../middleware/multerLeaveForm");
const fs = require("fs");

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
  const { name, designation, department, from_time, to_time, reason } =
    req.body;
  const username = req.headers["username"];

  try {
    const db = getMongoDB();
    const exitFormsCollection = db.collection("exit_forms");

    // Generate the reference number using the sequence function
    const ref_number = await getNextSequence(db, "exit_forms");

    // Create the exit form document with default values for additional fields
    const newExitForm = {
      ref_number,
      name,
      designation,
      department,
      created_by: username,
      from_time,
      to_time,
      reason,
      hr_acknowledgment_date: null, // Default value
      hr_approval: "pending", // Default value
      remarks: "", // Default value
      created_at: new Date(), // Optionally add a created_at timestamp
    };

    // Insert the new exit form into the collection
    const result = await exitFormsCollection.insertOne(newExitForm);

    if (result) {
      return res
        .status(200)
        .json({ message: "Exit Form Successfully Created" });
    } else {
      return res.status(500).json({ message: "Failed to create Exit Form" });
    }
  } catch (err) {
    console.error("Error creating exit form:", err);
    return res
      .status(500)
      .json({ message: "Database Error", error: err.message });
  }
});

router.get("/fetch", async (req, res) => {
  const { location, startDate, endDate } = req.query;
  const user = JSON.parse(req.headers["user"]);

  try {
    const db = getMongoDB();
    const exitFormsCollection = db.collection("exit_forms");

    // Build the query object based on the provided filters
    const query = {};

    if (location) {
      query.location = location;
    }

    if (startDate && endDate) {
      query.created_at = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      query.created_at = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.created_at = { $lte: new Date(endDate) };
    }
    if (user.privilege !== "admin" && user.privilege !== "manager") {
      query.created_by = user.username;
    }

    // Fetch the documents based on the query
    const results = await exitFormsCollection.find(query).toArray();

    // Convert the results and format the dates
    const convertedResults = results.map((form) => {
      return {
        ...form,
        created_at: form.created_at
          ? dayjs.utc(form.created_at).format("YYYY-MM-DD")
          : null,
        hr_acknowledgment_date: form.hr_acknowledgment_date
          ? dayjs.utc(form.hr_acknowledgment_date).format("YYYY-MM-DD")
          : null,
      };
    });

    res.status(200).json(convertedResults);
  } catch (err) {
    console.error("Database error:", err);
    return res
      .status(500)
      .json({ message: "Database error", error: err.message });
  }
});

router.put("/update/:id", async (req, res) => {
  const { id } = req.params; // This is actually the ref_number in MongoDB
  const { hr_acknowledgment_date, hr_approval, remarks } = req.body;

  // Convert id to a number if ref_number is stored as a number in MongoDB
  const ref_number = parseInt(id, 10);

  try {
    const db = getMongoDB();
    const exitFormsCollection = db.collection("exit_forms");

    // Update the exit form document
    const result = await exitFormsCollection.updateOne(
      { ref_number }, // Match by ref_number
      {
        $set: {
          hr_acknowledgment_date: hr_acknowledgment_date || null, // Default to null if not provided
          hr_approval: hr_approval || "pending", // Default to "pending" if not provided
          remarks: remarks || "", // Default to empty string if not provided
        },
      }
    );

    if (result.matchedCount === 1) {
      return res.status(200).json({
        message: `Exit form with ref_number ${ref_number} has been updated to ${hr_approval}`,
      });
    } else {
      return res
        .status(404)
        .json({ message: `Exit form with ref_number ${ref_number} not found` });
    }
  } catch (err) {
    console.error("Error updating exit form:", err);
    return res
      .status(500)
      .json({ message: "Database Error", error: err.message });
  }
});

router.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;
  const ref_number = parseInt(id, 10); // Ensure id is a number
  console.log("Deleting form with ref_number:", ref_number);

  try {
    const db = getMongoDB();
    const exitFormsCollection = db.collection("exit_forms");

    // Log the document to ensure it's correctly identified

    // Delete the exit form document
    const result = await exitFormsCollection.deleteOne({ ref_number });

    if (result.deletedCount === 1) {
      return res.status(200).json({
        message: `Exit form with ref_number ${ref_number} deleted successfully`,
      });
    } else {
      console.log("Deletion failed. Result:", result);
      return res
        .status(404)
        .json({ message: `Exit form with ref_number ${ref_number} not found` });
    }
  } catch (error) {
    console.error("Error deleting form:", error);
    return res
      .status(500)
      .json({ message: "Database Error", error: error.message });
  }
});

///////////////////////////////

router.post("/create_leave", async (req, res) => {
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
  const username = req.headers["username"];

  // Default values
  const leave_balance = 0;
  const manager_approval = "pending";
  const hr_approval = "pending";
  const comments = "";

  try {
    const db = getMongoDB();
    const leaveFormsCollection = db.collection("leave_forms");

    // Get the next sequence number
    const ref_number = await getNextSequence(db, "leave_forms");

    // Create the leave form document
    const newLeaveForm = {
      ref_number, // Sequence number for the leave form
      name,
      designation,
      department,
      employee_number,
      joining_date,
      type_of_leave,
      created_by: username,
      start_date,
      return_date,
      number_of_days,
      leave_balance, // Default value
      manager_approval, // Default value
      hr_approval, // Default value
      comments, // Default value
      created_at: new Date(), // Optionally add a created_at timestamp
    };

    // Insert the new leave form into the collection
    const result = await leaveFormsCollection.insertOne(newLeaveForm);

    if (result) {
      return res
        .status(200)
        .json({ message: "Leave Form Successfully Created" });
    } else {
      return res.status(500).json({ message: "Failed to create Leave Form" });
    }
  } catch (error) {
    console.error("Error creating leave form:", error);
    return res
      .status(500)
      .json({ message: "Database Error", error: error.message });
  }
});

router.get("/fetch_leave", async (req, res) => {
  const { location, startDate, endDate } = req.query;
  let query = {};
  const queryParams = [];
  const user = JSON.parse(req.headers["user"]);

  if (location) {
    query.location = location;
  }

  if (startDate && endDate) {
    query.date_created = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  } else if (startDate) {
    query.date_created = {
      $gte: new Date(startDate),
    };
  } else if (endDate) {
    query.date_created = {
      $lte: new Date(endDate),
    };
  }
  if (user.privilege !== "admin" && user.privilege !== "manager") {
    query.created_by = user.username;
  }

  try {
    const db = getMongoDB();
    const leaveFormsCollection = db.collection("leave_forms");
    const results = await leaveFormsCollection.find(query).toArray();

    const convertedResults = results.map((form) => {
      return {
        ...form,
        joining_date: form.joining_date
          ? new Date(form.joining_date).toISOString().split("T")[0]
          : null,
        start_date: form.start_date
          ? new Date(form.start_date).toISOString().split("T")[0]
          : null,
        return_date: form.return_date
          ? new Date(form.return_date).toISOString().split("T")[0]
          : null,
        created_at: form.created_at
          ? new Date(form.created_at).toISOString().split("T")[0]
          : null,
      };
    });

    res.status(200).json(convertedResults);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ message: "Database error", error: err });
  }
});

router.put("/update_leave/:id", async (req, res) => {
  const { id } = req.params; // This is actually the ref_number in MongoDB
  const { leave_balance, hr_approval, manager_approval, comments } = req.body;

  try {
    const db = getMongoDB();
    const leaveFormsCollection = db.collection("leave_forms");

    // Convert id to a number if needed
    const ref_number = parseInt(id, 10);

    // Update the leave form document
    const result = await leaveFormsCollection.updateOne(
      { ref_number }, // Match by ref_number
      {
        $set: {
          leave_balance: leave_balance || 0, // Default to 0 if not provided
          hr_approval: hr_approval || "pending", // Default to "pending" if not provided
          manager_approval: manager_approval || "pending", // Default to "pending" if not provided
          comments: comments || "", // Default to empty string if not provided
        },
      }
    );

    if (result.matchedCount === 1) {
      return res.status(200).json({
        message: `Leave form with ref_number:${ref_number} has been updated. HR Approval: ${hr_approval}`,
      });
    } else {
      return res.status(404).json({
        message: `Leave form with ref_number:${ref_number} not found`,
      });
    }
  } catch (err) {
    console.error("Error updating leave form:", err);
    return res
      .status(500)
      .json({ message: "Database Error", error: err.message });
  }
});

router.delete("/delete_leave/:id", async (req, res) => {
  const { id } = req.params;
  const ref_number = parseInt(id, 10); // Ensure id is a number
  console.log("Deleting form with ref_number:", ref_number);

  try {
    const db = getMongoDB();
    const leaveFormsCollection = db.collection("leave_forms");

    // Delete the leave form document
    const result = await leaveFormsCollection.deleteOne({ ref_number });

    if (result.deletedCount === 1) {
      return res.status(200).json({
        message: `Leave form with ref_number ${ref_number} deleted successfully`,
      });
    } else {
      console.log("Deletion failed. Result:", result);
      return res.status(404).json({
        message: `Leave form with ref_number ${ref_number} not found`,
      });
    }
  } catch (error) {
    console.error("Error deleting leave form:", error);
    return res
      .status(500)
      .json({ message: "Database Error", error: error.message });
  }
});

router.post(
  "/upload_receipt",
  uploadLeaveForms.single("file"),
  async (req, res) => {
    const { formId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      const db = getMongoDB();
      const fileCollection = db.collection("leave_files");

      // Generate a ref_number for the file using the sequence generator
      const file_ref_number = await getNextSequence(db, "leave_files");

      // Check if the file already exists
      const existingFile = await fileCollection.findOne({
        form_id: formId,
        file_name: file.originalname,
      });

      if (existingFile) {
        return res.status(400).json({ message: "File already exists" });
      }

      // File does not exist, proceed with insertion
      await fileCollection.insertOne({
        ref_number: file_ref_number, // Store generated ref_number with the file
        form_id: formId,
        file_name: file.originalname,
        file_url: file.path, // Ensure this path is accessible by your application
      });

      return res.status(200).json({
        message: `file Uploaded Successfully `,
      });
    } catch (err) {
      console.error("Error uploading file:", err);
      return res
        .status(500)
        .json({ message: "Database Error", error: err.message });
    }
  }
);
router.get("/fetch_files/:formId", async (req, res) => {
  const { formId } = req.params;

  try {
    const db = getMongoDB();
    const fileCollection = db.collection("leave_files");

    // Fetch files by quotationId
    const files = await fileCollection.find({ form_id: formId }).toArray();

    // Send a successful response with an empty list if no files are found
    res.status(200).json({ files });
  } catch (err) {
    console.error("Error fetching files:", err);
    return res
      .status(500)
      .json({ message: "Database Error", error: err.message });
  }
});
router.delete("/delete_files/:file_name/:file_url", async (req, res) => {
  const { file_name } = req.params;
  const file_url = decodeURIComponent(req.params.file_url);
  const filePath = file_url;

  try {
    const db = getMongoDB();
    const fileCollection = db.collection("leave_files");

    // Find and delete the file from the database using file_name
    const result = await fileCollection.deleteOne({ file_name: file_name });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "File not found" });
    }

    // Delete the file from the filesystem
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Couldn't delete file from filesystem", err);
        return res.status(500).json({ message: "File system error" });
      }

      return res.status(200).json({
        message: `File with file_name: ${file_name} successfully deleted`,
      });
    });
  } catch (error) {
    console.error("Couldn't delete file", error);
    return res.status(500).json({ message: "Database error" });
  }
});

module.exports = router;
