const mysql = require("mysql2");
require("dotenv").config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
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

module.exports = { connection, query };
