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
  const { name, company, website, email, phone, location } = req.body;
  const currentDate = getCurrentDateTimeUAE();
  const username = req.headers["username"];

  try {
    const db = getMongoDB(); // Get MongoDB instance
    const collection = db.collection("clients");

    // Generate the reference number
    const nextSeq = await getNextSequence(db, "clients");
    const refNumber = `cl-${nextSeq}`;

    const mongoDocument = {
      ref_number: refNumber,
      name,
      company,
      website,
      email,
      phone,
      location,
      date_created: currentDate,
      created_by: username,
    };

    await collection.insertOne(mongoDocument);

    return res
      .status(201)
      .json({ message: "Successfully added client to MongoDB" });
  } catch (err) {
    console.error("Error processing request", err);
    return res
      .status(500)
      .json({ message: "Error processing request", error: err.message });
  }
});

router.get("/fetch", async (req, res) => {
  const { location, startDate, endDate } = req.query;

  const query = {};
  const options = {};

  if (location) {
    query.location = location;
  }

  if (startDate && endDate) {
    const formattedStartDate = dayjs(startDate).startOf("day").toDate();
    const formattedEndDate = dayjs(endDate).endOf("day").toDate();
    query.date_created = {
      $gte: formattedStartDate,
      $lte: formattedEndDate,
    };
  } else if (startDate) {
    const formattedStartDate = dayjs(startDate).startOf("day").toDate();
    query.date_created = { $gte: formattedStartDate };
  } else if (endDate) {
    const formattedEndDate = dayjs(endDate).endOf("day").toDate();
    query.date_created = { $lte: formattedEndDate };
  }

  try {
    const db = getMongoDB(); // Get MongoDB instance
    const collection = db.collection("clients"); // Adjust collection name as needed
    const results = await collection.find(query).toArray();

    const convertedResults = results.map((client) => {
      const dateCreated = dayjs(client.date_created)
        .utc()
        .tz("Asia/Dubai")
        .format("YYYY-MM-DD");
      return {
        ...client,
        date_created: dateCreated,
      };
    });

    res.status(200).json(convertedResults);
  } catch (err) {
    console.error("Error fetching data from MongoDB:", err);
    res.status(500).json({ message: "Database error", error: err });
  }
});
router.delete("/delete/:ref_number", async (req, res) => {
  const { ref_number } = req.params;

  try {
    const db = getMongoDB(); // Get MongoDB instance

    // Get collections
    const clientsCollection = db.collection("clients");
    const quotationsCollection = db.collection("quotations");
    const itemsCollection = db.collection("items");

    // Fetch the client's quotations
    const quotations = await quotationsCollection
      .find({ client_ref_number: ref_number })
      .toArray();
    const quotationIds = quotations.map((quotation) => quotation.ref_number);

    // Delete items for each quotation
    if (quotationIds.length > 0) {
      await itemsCollection.deleteMany({
        quotation_ref_number: { $in: quotationIds },
      });

      // Delete the quotations
      await quotationsCollection.deleteMany({ client_ref_number: ref_number });
    }

    // Finally, delete the client
    const deleteResult = await clientsCollection.deleteOne({
      ref_number: ref_number,
    });

    if (deleteResult.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: `Client with ref_number ${ref_number} not found` });
    }

    return res.status(200).json({
      message: `Client with ref_number ${ref_number} deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting client:", error);
    return res
      .status(500)
      .json({ message: "Database Error", error: error.message });
  }
});

router.put("/update/:ref_number", async (req, res) => {
  const { name, company, website, email, phone, location } = req.body;
  const { ref_number } = req.params;

  try {
    const db = getMongoDB(); // Get MongoDB instance
    const collection = db.collection("clients");

    const updateResult = await collection.updateOne(
      { ref_number: ref_number }, // Filter by ref_number
      {
        $set: {
          name,
          company,
          website,
          email,
          phone,
          location,
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      return res
        .status(404)
        .json({ message: `Client with ref_number:${ref_number} not found` });
    }

    return res.status(200).json({
      message: `Client with ref_number:${ref_number} successfully updated`,
    });
  } catch (error) {
    console.error("Error updating client:", error);
    return res
      .status(500)
      .json({ message: "Database error", error: error.message });
  }
});

router.get("/fetch_client_names", async (req, res) => {
  try {
    const db = getMongoDB(); // Get MongoDB instance
    const clientsCollection = db.collection("clients");

    // Fetch all client names
    const clients = await clientsCollection
      .find({}, { projection: { _id: 0, name: 1 } })
      .toArray();

    // Extract names from the result
    const clientNames = clients.map((client) => client.name);

    return res.status(200).json(clientNames);
  } catch (error) {
    console.error("Error fetching client names:", error);
    return res
      .status(500)
      .json({ message: "Database error", error: error.message });
  }
});

module.exports = router;
