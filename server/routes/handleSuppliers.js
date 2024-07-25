// routes/suppliers.js
const express = require("express");
const db = require("../db");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const router = express.Router();

function getCurrentDateTimeUAE() {
  return dayjs().tz("Asia/Dubai").format("YYYY-MM-DD HH:mm:ss");
}

//Create Suppliers

router.post("/create", (req, res) => {
  const { name, email, phone, desc, location, website, company } = req.body;
  const username = req.headers["username"];
  const currentDate = getCurrentDateTimeUAE();
  console.log("Current Date (UAE Time):", currentDate);

  const query =
    "INSERT INTO suppliers(company,website,name,email,phone,description,location,date_created,last_updated,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)";
  const values = [
    company,
    website,
    name,
    email,
    phone,
    desc,
    location,
    currentDate,
    currentDate,
    username,
  ];

  console.log("Query:", query);
  console.log("Values:", values);

  db.query(query, values, (err, results) => {
    if (err) {
      console.error("error executing query", err);
      return res.status(500).json({ message: "database error", error: err });
    }
    return res
      .status(201)
      .json({ message: "successfully added supplier", data: results });
  });
});

//Fetch Suppliers with filters For Main Table

router.get("/fetch", (req, res) => {
  const { location, startDate, endDate } = req.query;
  let query = "SELECT * FROM suppliers WHERE 1=1 ";
  const queryParams = [];

  //Constructing Query IF filters exist

  if (location) {
    query += " AND location = ?";
    queryParams.push(location);
  }
  if (startDate && endDate) {
    const formattedStartDate = dayjs(startDate).format("YYYY-MM-DD");
    const formattedEndDate = dayjs(endDate).format("YYYY-MM-DD");
    query += " AND date_created BETWEEN ? AND ?";
    queryParams.push(formattedStartDate, formattedEndDate);
  } else if (startDate) {
    const formattedStartDate = dayjs(startDate).format("YYYY-MM-DD");
    query += " AND date_created >= ?";
    queryParams.push(formattedStartDate);
  } else if (endDate) {
    const formattedEndDate = dayjs(endDate).format("YYYY-MM-DD");
    query += " AND date_created <= ?";
    queryParams.push(formattedEndDate);
  }

  db.query(query, queryParams, (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    }
    const convertedResults = results.map((form) => {
      const dateCreated = dayjs
        .utc(form.date_created)
        .tz(`Asia/Dubai`)
        .format("YYYY-MM-DD");
      const fromDate = dayjs
        .utc(form.from_date)
        .tz(`Asia/Dubai`)
        .format("YYYY-MM-DD");
      const toDate = dayjs
        .utc(form.to_date)
        .tz(`Asia/Dubai`)
        .format("YYYY-MM-DD");
      return {
        ...form,
        date_created: dateCreated,
        from_date: fromDate,
        to_date: toDate,
      };
    });

    res.status(200).json(convertedResults);
  });
});

//Delete Suppliers

router.delete("/delete/:id", (req, res) => {
  const { id } = req.params;

  try {
    // First, fetch the orders related to the supplier
    const fetchOrdersQuery = "SELECT id FROM orders WHERE supplier_id=?";
    db.query(fetchOrdersQuery, [id], (err, orders) => {
      if (err) {
        console.error("Error fetching orders", err);
        return res.status(500).json({ message: "Database Error", error: err });
      }

      const orderIds = orders.map((order) => order.id);

      // Next, delete order items for each order
      if (orderIds.length > 0) {
        const deleteOrderItemsQuery =
          "DELETE FROM order_items WHERE order_id IN (?)";
        db.query(deleteOrderItemsQuery, [orderIds], (err, orderItemsResult) => {
          if (err) {
            console.error("Error deleting order items", err);
            return res
              .status(500)
              .json({ message: "Database Error", error: err });
          }

          // Now delete the orders
          const deleteOrdersQuery = "DELETE FROM orders WHERE supplier_id=?";
          db.query(deleteOrdersQuery, [id], (err, orderResults) => {
            if (err) {
              console.error("Error deleting orders", err);
              return res
                .status(500)
                .json({ message: "Database Error", error: err });
            }

            // Finally, delete the supplier
            const deleteSupplierQuery = "DELETE FROM suppliers WHERE id=?";
            db.query(deleteSupplierQuery, [id], (err, supplierResults) => {
              if (err) {
                console.error("Error deleting supplier", err);
                return res
                  .status(500)
                  .json({ message: "Database Error", error: err });
              }

              return res
                .status(200)
                .json({
                  message: `Supplier with ID ${id} deleted successfully`,
                });
            });
          });
        });
      } else {
        // If no orders are found, delete the supplier directly
        const deleteSupplierQuery = "DELETE FROM suppliers WHERE id=?";
        db.query(deleteSupplierQuery, [id], (err, supplierResults) => {
          if (err) {
            console.error("Error deleting supplier", err);
            return res
              .status(500)
              .json({ message: "Database Error", error: err });
          }

          return res
            .status(200)
            .json({ message: `Supplier with ID ${id} deleted successfully` });
        });
      }
    });
  } catch (error) {
    console.error("Error deleting supplier", error);
    return res
      .status(500)
      .json({ message: "Database Error", error: error.message });
  }
});

//Update Suppliers Also Insert Payment Details

router.put("/update/:id", (req, res) => {
  const { id } = req.params;
  const { name, email, phone, desc, location } = req.body;
  const currentDate = getCurrentDateTimeUAE();

  //Update existing information Query

  const query =
    "UPDATE suppliers SET name=?, email=?, phone=?, description=?, location=?, last_updated=? WHERE id=?";
  const values = [name, email, phone, desc, location, currentDate, id];

  db.query(query, values, (err, results) => {
    if (err) {
      console.error("Error updating supplier", err);
      return res.status(500).json({ message: "Database Error", error: err });
    }
    return res
      .status(200)
      .json({ message: `successfully updated supplier with id:${id}` });
  });
});

module.exports = router;
