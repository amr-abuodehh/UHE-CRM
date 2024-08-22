// routes/suppliers.js
const express = require("express");
const db = require("../db");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const { getMongoDB } = require("../db");

dayjs.extend(utc);
dayjs.extend(timezone);

const router = express.Router();

function getCurrentDateTimeUAE() {
  return dayjs().tz("Asia/Dubai").format("YYYY-MM-DD HH:mm:ss");
}

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
  const { name, email, phone, desc, location, website, company } = req.body;
  const username = req.headers["username"];
  const currentDate = getCurrentDateTimeUAE();
  console.log("Current Date (UAE Time):", currentDate);

  try {
    const db = getMongoDB();
    const suppliersCollection = db.collection("suppliers");

    // Generate the next sequence number and add "SP-" prefix
    const sequenceNumber = await getNextSequence(db, "suppliers");
    const ref_number = `SP-${sequenceNumber}`;

    const newSupplier = {
      ref_number,
      company,
      website,
      name,
      email,
      phone,
      description: desc,
      location,
      date_created: currentDate,
      last_updated: currentDate,
      created_by: username,
    };

    console.log("New Supplier Data:", newSupplier);

    await suppliersCollection.insertOne(newSupplier);
    return res
      .status(201)
      .json({ message: "Supplier successfully added", ref_number });
  } catch (error) {
    console.error("Error adding supplier", error);
    return res
      .status(500)
      .json({ message: "Database error", error: error.message });
  }
});

//Fetch Suppliers with filters For Main Table
router.get("/fetch", async (req, res) => {
  const { location, startDate, endDate } = req.query;

  try {
    const db = getMongoDB();
    const suppliersCollection = db.collection("suppliers");

    // Build the query object for MongoDB
    const query = {};

    if (location) {
      query.location = location;
    }

    if (startDate && endDate) {
      query.date_created = {
        $gte: new Date(dayjs(startDate).format("YYYY-MM-DD")),
        $lte: new Date(dayjs(endDate).format("YYYY-MM-DD")),
      };
    } else if (startDate) {
      query.date_created = {
        $gte: new Date(dayjs(startDate).format("YYYY-MM-DD")),
      };
    } else if (endDate) {
      query.date_created = {
        $lte: new Date(dayjs(endDate).format("YYYY-MM-DD")),
      };
    }

    // Fetch results from MongoDB
    const suppliers = await suppliersCollection.find(query).toArray();

    // Convert dates to formatted strings in the results
    const convertedResults = suppliers.map((supplier) => {
      const dateCreated = dayjs
        .utc(supplier.date_created)
        .tz(`Asia/Dubai`)
        .format("YYYY-MM-DD");

      return {
        ...supplier,
        date_created: dateCreated,
      };
    });

    res.status(200).json(convertedResults);
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return res
      .status(500)
      .json({ message: "Database error", error: error.message });
  }
});

//Delete Suppliers

router.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const db = getMongoDB();
    const suppliersCollection = db.collection("suppliers");
    const ordersCollection = db.collection("orders");
    const orderItemsCollection = db.collection("order_items");

    // First, fetch the orders related to the supplier
    const orders = await ordersCollection.find({ supplier_id: id }).toArray();

    const orderIds = orders.map((order) => order._id); // Assuming `_id` is the order ID in MongoDB

    if (orderIds.length > 0) {
      // Next, delete order items for each order
      await orderItemsCollection.deleteMany({ order_id: { $in: orderIds } });

      // Now delete the orders
      await ordersCollection.deleteMany({ supplier_id: id });
    }

    // Finally, delete the supplier
    const deleteResult = await suppliersCollection.deleteOne({
      ref_number: id,
    });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({
        message: `Supplier with ID ${id} not found`,
      });
    }

    return res.status(200).json({
      message: `Supplier with ID ${id} deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting supplier", error);
    return res
      .status(500)
      .json({ message: "Database Error", error: error.message });
  }
});

//Update Suppliers Also Insert Payment Details

router.put("/update/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, desc, location } = req.body;
  const currentDate = getCurrentDateTimeUAE();

  try {
    const db = getMongoDB();
    const suppliersCollection = db.collection("suppliers");

    // Update existing supplier information
    const updateResult = await suppliersCollection.updateOne(
      { ref_number: id }, // Find the supplier by ref_number
      {
        $set: {
          name: name,
          email: email,
          phone: phone,
          description: desc,
          location: location,
          last_updated: currentDate,
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({
        message: `Supplier with ID ${id} not found`,
      });
    }

    return res
      .status(200)
      .json({ message: `Successfully updated supplier with ID: ${id}` });
  } catch (error) {
    console.error("Error updating supplier", error);
    return res
      .status(500)
      .json({ message: "Database Error", error: error.message });
  }
});

module.exports = router;
