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

router.post("/create", (req, res) => {
  const { name, company, website, email, phone, location } = req.body;
  const currentDate = getCurrentDateTimeUAE();
  const username = req.headers["username"];
  query =
    "INSERT INTO clients(name,company,website,email,phone,location,date_created,created_by) VALUES (?,?,?,?,?,?,?,?)";
  values = [
    name,
    company,
    website,
    email,
    phone,
    location,
    currentDate,
    username,
  ];

  db.query(query, values, (err, results) => {
    if (err) {
      console.error("error executing query", err);
      return res.status(500).json({ message: "Database error", error: err });
    }
    return res.status(201).json({ message: "successfully added client" });
  });
});

router.get("/fetch", (req, res) => {
  const { location, startDate, endDate } = req.query;
  let query = "SELECT * FROM clients WHERE 1=1";
  const queryParams = [];

  if (location) {
    query += " AND location=?";
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
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database error", error: err });
    }

    const convertedResults = results.map((client) => {
      const dateCreated = dayjs
        .utc(client.date_created)
        .tz("Asia/Dubai")
        .format("YYYY-MM-DD ");
      return {
        ...client,
        date_created: dateCreated,
      };
    });

    res.status(200).json(convertedResults);
  });
});

router.delete("/delete/:id", (req, res) => {
  const { id } = req.params;

  try {
    // First, fetch the orders related to the supplier
    const fetchQuotationsQuery = "SELECT id FROM quotations WHERE client_id=?";
    db.query(fetchQuotationsQuery, [id], (err, quotations) => {
      if (err) {
        console.error("Error fetching quotations", err);
        return res.status(500).json({ message: "Database Error", error: err });
      }

      const quotationIds = quotations.map((quotation) => quotation.id);

      // Next, delete order items for each order
      if (quotationIds.length > 0) {
        const deleteQuotationItemsQuery =
          "DELETE FROM items WHERE quotation_id IN (?)";
        db.query(
          deleteQuotationItemsQuery,
          [quotationIds],
          (err, quotationItemsResult) => {
            if (err) {
              console.error("Error deleting quotation items", err);
              return res
                .status(500)
                .json({ message: "Database Error", error: err });
            }

            // Now delete the orders
            const deleteQuotationQuery =
              "DELETE FROM quotations WHERE client_id=?";
            db.query(deleteQuotationQuery, [id], (err, quotationResults) => {
              if (err) {
                console.error("Error deleting quotation", err);
                return res
                  .status(500)
                  .json({ message: "Database Error", error: err });
              }

              // Finally, delete the supplier
              const deleteClientQuery = "DELETE FROM clients WHERE id=?";
              db.query(deleteClientQuery, [id], (err, clientResults) => {
                if (err) {
                  console.error("Error deleting client", err);
                  return res
                    .status(500)
                    .json({ message: "Database Error", error: err });
                }

                return res.status(200).json({
                  message: `Client with ID ${id} deleted successfully`,
                });
              });
            });
          }
        );
      } else {
        // If no orders are found, delete the supplier directly
        const deleteClientQuery = "DELETE FROM clients WHERE id=?";
        db.query(deleteClientQuery, [id], (err, clientResults) => {
          if (err) {
            console.error("Error deleting client", err);
            return res
              .status(500)
              .json({ message: "Database Error", error: err });
          }

          return res
            .status(200)
            .json({ message: `Client with ID ${id} deleted successfully` });
        });
      }
    });
  } catch (error) {
    console.error("Error deleting client", error);
    return res
      .status(500)
      .json({ message: "Database Error", error: error.message });
  }
});

router.put("/update/:id", (req, res) => {
  const { name, company, website, email, phone, location } = req.body;
  const { id } = req.params;
  const query =
    "UPDATE clients SET name=?, company=?, website=?, email=?, phone=?, location=? WHERE id=?";
  const values = [name, company, website, email, phone, location, id];
  try {
    db.query(query, values, (err, results) => {
      if (err) {
        console.error("error updating supplier", err);
        return res.status(500).json({ message: "database error", error: err });
      }
      return res
        .status(200)
        .json({ message: `Supplier with ID:${id} Successfully Updated` });
    });
  } catch (error) {
    console.error("error updating supplier", error);
    return res.status(500).json({ message: "Database Error", error });
  }
});

router.get("/fetch_client_names", (req, res) => {
  const query = "SELECT name FROM clients";
  db.query(query, (err, results) => {
    if (err) {
      console.error("error fetching clients:", err);
      return res.status(500).json({ message: "Database error", error: err });
    }
    const clients = results.map((row) => row.name);
    return res.status(200).json(clients);
  });
});

module.exports = router;
