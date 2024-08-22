const express = require("express");
const db = require("../db");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const uploadOrderReceipts = require("../middleware/multerOrderReceipts");
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

router.post("/new_order", async (req, res) => {
  const { supplier_id, supplier_name, created_by } = req.body;

  try {
    const db = getMongoDB(); // Get MongoDB instance
    const collection = db.collection("orders");

    // Generate the reference number
    const nextSeq = await getNextSequence(db, "orders");
    const refNumber = `ON-${nextSeq}`;

    const newOrder = {
      supplier_id,
      supplier_name,
      created_by,
      ref_number: refNumber,
      date_created: new Date(), // Or use getCurrentDateTimeUAE() if you have that function
      status: "pending",
      amount_paid: 0,
      subtotal: 0,
      pending_payment: 0,
    };

    const result = await collection.insertOne(newOrder);

    res.status(201).json({
      message: "Order created successfully",
      order_id: result.insertedId,
      ref_number: refNumber,
    });
  } catch (err) {
    console.error("Error inserting new order:", err);
    res
      .status(500)
      .json({ message: "Error inserting new order", error: err.message });
  }
});

router.get("/fetch_orders", async (req, res) => {
  const { location, startDate, endDate } = req.query;

  try {
    const db = getMongoDB(); // Get MongoDB instance
    const collection = db.collection("orders");

    // Build the query
    const query = {};
    if (location) {
      query.supplier_name = location; // Assuming location is stored in supplier_name
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

    // Fetch orders from MongoDB
    const orders = await collection.find(query).toArray();

    // Process and format the results
    const ordersWithDetails = orders.map((order) => {
      const dateCreated = dayjs(order.date_created).format("YYYY-MM-DD");
      const pendingPayment = Math.max(
        0,
        order.subtotal - (order.amount_paid || 0)
      );
      const status =
        pendingPayment <= 0 && order.subtotal > 0 ? "finished" : order.status;

      return {
        ...order,
        date_created: dateCreated,
        pending_payment: pendingPayment,
        status,
      };
    });

    res.status(200).json(ordersWithDetails);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Database error", error: error.message });
  }
});

router.put("/cancel/:id", async (req, res) => {
  const { id } = req.params; // ref_number in your case

  try {
    const db = getMongoDB(); // Get MongoDB instance
    const collection = db.collection("orders");

    // Update the order status to 'canceled'
    const result = await collection.updateOne(
      { ref_number: id },
      { $set: { status: "canceled" } }
    );

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ message: `Order with ref_number: ${id} not found` });
    }

    return res
      .status(200)
      .json({ message: `Order with ref_number: ${id} canceled successfully` });
  } catch (error) {
    console.error("Error canceling order", error);
    return res
      .status(500)
      .json({ message: "Database error", error: error.message });
  }
});

router.post("/newitem", async (req, res) => {
  const { orderId, item_name, item_description, price, quantity } = req.body;

  try {
    const db = getMongoDB(); // Get MongoDB instance
    const itemsCollection = db.collection("order_items");
    const ordersCollection = db.collection("orders");

    // Calculate total for the new item
    const total = price * quantity;

    // Insert the new item
    await itemsCollection.insertOne({
      order_ref_number: orderId,
      item_name,
      item_description,
      price,
      quantity,
      total, // Add total to the item document
    });

    // Calculate the new subtotal
    const items = await itemsCollection
      .find({ order_ref_number: orderId })
      .toArray();

    const newSubtotal = items.reduce((sum, item) => sum + item.total, 0);

    // Update the order's subtotal
    const result = await ordersCollection.updateOne(
      { ref_number: orderId },
      { $set: { subtotal: newSubtotal } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Order not found" });
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

router.delete("/delete/:id", async (req, res) => {
  const { id } = req.params; // ref_number in your case

  try {
    const db = getMongoDB(); // Get MongoDB instance
    const ordersCollection = db.collection("orders");
    const orderItemsCollection = db.collection("order_items");

    // First, delete order items related to the order
    const deleteOrderItemsResult = await orderItemsCollection.deleteMany({
      order_ref_number: id,
    });

    if (deleteOrderItemsResult.deletedCount === 0) {
      console.log(`No order items found for order with ref_number: ${id}`);
    }

    // Next, delete the order
    const deleteOrderResult = await ordersCollection.deleteOne({
      ref_number: id,
    });

    if (deleteOrderResult.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: `Order with ref_number: ${id} not found` });
    }

    return res
      .status(200)
      .json({ message: `Order with ref_number: ${id} deleted successfully` });
  } catch (error) {
    console.error("Error deleting order", error);
    return res
      .status(500)
      .json({ message: "Database error", error: error.message });
  }
});

router.get("/fetch_items/:selectedOrder", async (req, res) => {
  const { selectedOrder } = req.params;

  try {
    const db = getMongoDB(); // Get MongoDB instance
    const itemsCollection = db.collection("order_items");

    // Fetch items from MongoDB
    const items = await itemsCollection
      .find({ order_ref_number: selectedOrder })
      .toArray();

    if (items.length === 0) {
      return res
        .status(404)
        .json({ message: "No items found for the selected order" });
    }

    return res.status(200).json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
});

router.post("/add_payment", async (req, res) => {
  const { amount_paid, order_ref_number } = req.body;

  try {
    const db = getMongoDB(); // Get MongoDB instance
    const ordersCollection = db.collection("orders");

    // Fetch the current order
    const order = await ordersCollection.findOne({
      ref_number: order_ref_number,
    });

    if (!order) {
      return res.status(404).json({
        message: `Order with ref_number: ${order_ref_number} not found`,
      });
    }

    // Calculate the new amount_paid
    const newAmountPaid = (order.amount_paid || 0) + amount_paid;

    // Update the order with the new amount_paid
    await ordersCollection.updateOne(
      { ref_number: order_ref_number },
      { $set: { amount_paid: newAmountPaid } }
    );

    // Calculate the pending payment
    const pendingPayment = Math.max(0, (order.subtotal || 0) - newAmountPaid);

    // Update the order with the new pending_payment
    await ordersCollection.updateOne(
      { ref_number: order_ref_number },
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
  uploadOrderReceipts.single("file"),
  async (req, res) => {
    const { orderId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      const db = getMongoDB();
      const fileCollection = db.collection("order_files");

      // Generate a ref_number for the file using the sequence generator
      const file_ref_number = await getNextSequence(db, "order_files");

      // Check if the file already exists
      const existingFile = await fileCollection.findOne({
        order_id: orderId,
        file_name: file.originalname,
      });

      if (existingFile) {
        return res.status(400).json({ message: "File already exists" });
      }

      // File does not exist, proceed with insertion
      await fileCollection.insertOne({
        ref_number: file_ref_number, // Store generated ref_number with the file
        order_id: orderId,
        file_name: file.originalname,
        file_url: file.path, // Ensure this path is accessible by your application
      });

      return res.status(200).json({
        message: `Receipt Uploaded Successfully for order ${orderId} with ref_number ${file_ref_number}`,
      });
    } catch (err) {
      console.error("Error uploading file:", err);
      return res
        .status(500)
        .json({ message: "Database Error", error: err.message });
    }
  }
);
router.get("/fetch_files/:orderId", async (req, res) => {
  const { orderId } = req.params;

  try {
    const db = getMongoDB();
    const fileCollection = db.collection("order_files");

    // Fetch files associated with the given orderId
    const files = await fileCollection.find({ order_id: orderId }).toArray();

    res.status(200).json({ files });
  } catch (err) {
    console.error("Error fetching files:", err);
    res.status(500).json({ message: "Database Error", error: err.message });
  }
});

router.delete("/delete_files/:file_name/:file_url", async (req, res) => {
  const { file_name } = req.params;
  const file_url = decodeURIComponent(req.params.file_url);
  const filePath = file_url;

  try {
    const db = getMongoDB();
    const fileCollection = db.collection("order_files");

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
    return res
      .status(500)
      .json({ message: "Database error", error: error.message });
  }
});

module.exports = router;
