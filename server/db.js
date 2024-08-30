const { MongoClient } = require("mongodb"); // Corrected import

require("dotenv").config();

const mongoUri = process.env.MONGO_URI;

let mongoClient;
let mongoDb;

const connectToMongoDB = async () => {
  try {
    mongoClient = new MongoClient(mongoUri);
    console.log("Connected to MongoDB Atlas.");
    mongoDb = mongoClient.db("UHE");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  }
};

const getMongoDB = () => {
  if (!mongoDb) {
    throw new Error(
      "MongoDB not connected. Please call connectToMongoDB first."
    );
  }
  return mongoDb;
};

module.exports = { connectToMongoDB, getMongoDB };
