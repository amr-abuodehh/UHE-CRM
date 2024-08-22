const mysql = require("mysql2");
const { MongoClient } = require("mongodb"); // Corrected import

require("dotenv").config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const mongoUri = process.env.MONGO_URI;

let mongoClient;
let mongoDb;

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to the MySQL database:", err);
    return;
  }
  console.log("Connected to the MySQL database.");
});

function query(sql, params, callback) {
  return connection.query(sql, params, (err, results, fields) => {
    if (err) {
      console.error("Error executing query:", err);
      callback(err, null);
      return;
    }
    callback(null, results);
  });
}

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

module.exports = { connection, query, connectToMongoDB, getMongoDB };
