const express = require("express");
const db = require("../db");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const uploadQuotationReceipts = require("../middleware/multerQuotationReceipts");
const path = require("path");
const { getMongoDB } = require("../db");
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

router.post("/create_quotation", async (req, res) => {
  const { client_id, client_name, created_by } = req.body;

  try {
    const db = getMongoDB(); // Get MongoDB instance
    const collection = db.collection("quotations");

    // Generate the reference number
    const nextSeq = await getNextSequence(db, "quotations");
    const refNumber = `QT-${nextSeq}`;

    const newQuotation = {
      client_id,
      client_name,
      created_by,
      ref_number: refNumber,
      date_created: new Date(), // Or use getCurrentDateTimeUAE() if you have that function
      status: "pending",
      amount_paid: 0,
      subtotal: 0,
      pending_payment: 0,
    };

    const result = await collection.insertOne(newQuotation);

    res.status(201).json({
      message: "Quotation created successfully",
      quotation_id: result.insertedId,
      ref_number: refNumber,
    });
  } catch (err) {
    console.error("Error inserting new quotation:", err);
    res
      .status(500)
      .json({ message: "Error inserting new quotation", error: err.message });
  }
});

router.get("/fetch_quotations", async (req, res) => {
  const { location, startDate, endDate } = req.query;

  try {
    const db = getMongoDB(); // Get MongoDB instance
    const collection = db.collection("quotations");

    // Build the query
    const query = {};
    if (location) {
      query.client_name = location; // Assuming location is stored in client_name
    }

    if (startDate || endDate) {
      query.date_created = {};
      if (startDate) {
        query.date_created.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date_created.$lte = new Date(endDate);
      }
    }

    // Fetch quotations from MongoDB
    const quotations = await collection.find(query).toArray();

    // Process and format the results
    const quotationsWithDetails = quotations.map((quotation) => {
      const dateCreated = dayjs(quotation.date_created).format("YYYY-MM-DD");
      const pendingPayment = Math.max(
        0,
        quotation.subtotal - (quotation.amount_paid || 0)
      );
      const status =
        pendingPayment <= 0 && quotation.subtotal > 0
          ? "finished"
          : quotation.status;

      return {
        ...quotation,
        date_created: dateCreated,
        pending_payment: pendingPayment,
        status,
      };
    });

    res.status(200).json(quotationsWithDetails);
  } catch (error) {
    console.error("Error fetching quotations:", error);
    res.status(500).json({ message: "Database error", error: error.message });
  }
});

router.put("/cancel/:ref_number", async (req, res) => {
  const { ref_number } = req.params;

  try {
    const db = getMongoDB(); // Get MongoDB instance
    const collection = db.collection("quotations");

    const result = await collection.updateOne(
      { ref_number: ref_number },
      { $set: { status: "canceled" } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: `Quotation with ref_number: ${ref_number} not found`,
      });
    }

    return res.status(200).json({
      message: `Quotation with ref_number: ${ref_number} canceled successfully`,
    });
  } catch (error) {
    console.error("Error canceling quotation", error);
    return res
      .status(500)
      .json({ message: "Database error", error: error.message });
  }
});

router.post("/newitem", async (req, res) => {
  const { quotationId, item_name, item_description, price, quantity } =
    req.body;

  try {
    const db = getMongoDB();
    const itemsCollection = db.collection("items");
    const quotationsCollection = db.collection("quotations");

    // Calculate total for the new item
    const total = price * quantity;

    // Insert the new item
    await itemsCollection.insertOne({
      quotation_id: quotationId,
      item_name,
      item_description,
      price,
      quantity,
      total, // Add total to the item document
    });

    // Calculate the new subtotal
    const items = await itemsCollection
      .find({ quotation_id: quotationId })
      .toArray();

    const newSubtotal = items.reduce((sum, item) => sum + item.total, 0);

    // Update the order's subtotal
    const result = await quotationsCollection.updateOne(
      { ref_number: quotationId },
      { $set: { subtotal: newSubtotal } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    return res.status(200).json({
      message: "Item added and order subtotal updated successfully",
    });
  } catch (err) {
    console.error("Error processing request:", err);
    return res
      .status(500)
      .json({ message: "Server Error", error: err.message });
  }
});

router.delete("/delete/:ref_number", async (req, res) => {
  const { ref_number } = req.params;

  try {
    const db = getMongoDB(); // Get MongoDB instance
    const collection = db.collection("quotations");

    // First, delete the items associated with the quotation
    await db
      .collection("items")
      .deleteMany({ quotation_ref_number: ref_number });

    // Then, delete the quotation
    const result = await collection.deleteOne({ ref_number: ref_number });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: `Quotation with ref_number: ${ref_number} not found`,
      });
    }

    return res.status(200).json({
      message: `Quotation with ref_number: ${ref_number} deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting quotation", error);
    return res
      .status(500)
      .json({ message: "Database Error", error: error.message });
  }
});

router.get("/fetch_items/:selectedQuotation", async (req, res) => {
  const { selectedQuotation } = req.params;

  try {
    const db = getMongoDB();
    const itemsCollection = db.collection("items");

    // Fetch items by quotationId
    const items = await itemsCollection
      .find({ quotation_id: selectedQuotation })
      .toArray();

    // Return the items
    res.status(200).json(items);
  } catch (err) {
    console.error("Error fetching items:", err);
    res.status(500).json({ message: "Database Error", error: err.message });
  }
});

router.post("/add_payment", async (req, res) => {
  const { amount_paid, ref_number } = req.body;

  try {
    const db = getMongoDB(); // Get MongoDB instance
    const collection = db.collection("quotations");

    // Fetch the current quotation
    const quotation = await collection.findOne({ ref_number });

    if (!quotation) {
      return res.status(404).json({
        message: `Quotation with ref_number: ${ref_number} not found`,
      });
    }

    // Calculate the new amount_paid
    const newAmountPaid = (quotation.amount_paid || 0) + amount_paid;

    // Update the quotation with the new amount_paid
    await collection.updateOne(
      { ref_number },
      { $set: { amount_paid: newAmountPaid } }
    );

    // Calculate the pending payment
    const pendingPayment = Math.max(
      0,
      (quotation.subtotal || 0) - newAmountPaid
    );

    // Update the quotation with the new pending_payment
    await collection.updateOne(
      { ref_number },
      { $set: { pending_payment: pendingPayment } }
    );

    return res.status(200).json({ message: "Payment added successfully" });
  } catch (error) {
    console.error("Error updating payment", error);
    return res
      .status(500)
      .json({ message: "Failed to update payment", error: error.message });
  }
});

router.post(
  "/upload_receipt",
  uploadQuotationReceipts.single("file"),
  async (req, res) => {
    const { quotationId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      const db = getMongoDB();
      const fileCollection = db.collection("quotation_files");

      // Generate a ref_number for the file using the sequence generator
      const file_ref_number = await getNextSequence(db, "q_files");

      // Check if the file already exists
      const existingFile = await fileCollection.findOne({
        quotation_id: quotationId,
        file_name: file.originalname,
      });

      if (existingFile) {
        return res.status(400).json({ message: "File already exists" });
      }

      // File does not exist, proceed with insertion
      await fileCollection.insertOne({
        ref_number: file_ref_number, // Store generated ref_number with the file
        quotation_id: quotationId,
        file_name: file.originalname,
        file_url: file.path, // Ensure this path is accessible by your application
      });

      return res.status(200).json({
        message: `Receipt Uploaded Successfully for quotation ${quotationId} with ref_number ${file_ref_number}`,
      });
    } catch (err) {
      console.error("Error uploading file:", err);
      return res
        .status(500)
        .json({ message: "Database Error", error: err.message });
    }
  }
);
router.get("/fetch_files/:quotationId", async (req, res) => {
  const { quotationId } = req.params;

  try {
    const db = getMongoDB();
    const fileCollection = db.collection("quotation_files");

    // Fetch files by quotationId
    const files = await fileCollection
      .find({ quotation_id: quotationId })
      .toArray();

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
    const fileCollection = db.collection("quotation_files");

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
