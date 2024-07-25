const express = require("express");
const db = require("../db");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const uploadQuotationReceipts = require("../middleware/multerQuotationReceipts");
const path = require("path");
const fs = require("fs");

dayjs.extend(utc);
dayjs.extend(timezone);

const router = express.Router();

router.post("/create_quotation", (req, res) => {
  const { client_id, client_name, created_by } = req.body;

  const insertQuery =
    "INSERT INTO quotations (client_id, client_name, created_by, quotation_number, date_created, status) VALUES (?, ?, ?, ?, CURDATE(), ?)";

  db.query(
    insertQuery,
    [client_id, client_name, created_by, 0, "pending"],
    (err, result) => {
      if (err) {
        console.error("Error inserting new quotation:", err);
        return res
          .status(500)
          .send({ message: "Error inserting new quotation" });
      }

      const quotationId = result.insertId;
      const quotationNumber = `ON.${quotationId}`;

      const updateQuery =
        "UPDATE quotations SET quotation_number = ? WHERE id = ?";

      db.query(
        updateQuery,
        [quotationNumber, quotationId],
        (err, updateResult) => {
          if (err) {
            console.error("Error updating quotation number:", err);
            return res
              .status(500)
              .send({ message: "Error updating quotation number" });
          }

          res.status(201).send({
            message: "Quotation created successfully",
            quotation_id: quotationId,
            quotation_number: quotationNumber,
          });
        }
      );
    }
  );
});

router.get("/fetch_quotations", (req, res) => {
  const { location, startDate, endDate } = req.query;
  let query = "SELECT * FROM quotations WHERE 1=1";
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

    const quotationsWithDetails = results.map((quotation) => {
      const dateCreated = dayjs
        .utc(quotation.date_created)
        .tz("Asia/Dubai")
        .format("YYYY-MM-DD");

      const pending_payment = Math.max(
        0,
        quotation.subtotal - (quotation.amount_paid || 0)
      );
      const status =
        pending_payment <= 0 && quotation.subtotal > 0
          ? "finished"
          : quotation.status;

      return {
        ...quotation,
        date_created: dateCreated,
        pending_payment,
        status,
      };
    });

    res.status(200).json(quotationsWithDetails);
  });
});

router.put("/cancel/:id", (req, res) => {
  const { id } = req.params;
  try {
    const query = "UPDATE quotations SET status = 'canceled' WHERE id=?";
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error("Error updating quotation status", err);
        return res.status(500).json({ message: "Database Error", error: err });
      }
      if (results.affectedRows === 0) {
        return res
          .status(404)
          .json({ message: `Quotation with ID: ${id} not found` });
      }
      return res
        .status(200)
        .json({ message: `Quotation with ID: ${id} canceled successfully` });
    });
  } catch (error) {
    console.error("Error canceling Order", error);
    return res
      .status(500)
      .json({ message: "Database error", error: error.message });
  }
});

router.post("/newitem", (req, res) => {
  const { quotationId, item_name, item_description, price, quantity } =
    req.body;
  console.log(item_name, item_description);

  // Insert the new item into the order_items table
  const insertItemQuery = `
      INSERT INTO items (quotation_id, item_name, item_description, price, quantity)
      VALUES (?, ?, ?, ?, ?)
  `;
  db.query(
    insertItemQuery,
    [quotationId, item_name, item_description, price, quantity],
    (err, result) => {
      if (err) {
        console.error("Error inserting new item:", err);
        return res.status(500).json({ message: "Failed to add new item" });
      }

      // Calculate the new subtotal
      const calculateSubtotalQuery = `
          SELECT SUM(total) AS subtotal FROM items WHERE quotation_id = ?
      `;
      db.query(calculateSubtotalQuery, [quotationId], (err, result) => {
        if (err) {
          console.error("Error calculating subtotal:", err);
          return res
            .status(500)
            .json({ message: "Failed to calculate subtotal" });
        }

        const newSubtotal = result[0].subtotal;

        // Update the order's subtotal
        const updateOrderQuery = `
              UPDATE quotations SET subtotal = ? WHERE id = ?
          `;
        db.query(
          updateOrderQuery,
          [newSubtotal, quotationId],
          (err, result) => {
            if (err) {
              console.error("Error updating order subtotal:", err);
              return res
                .status(500)
                .json({ message: "Failed to update order subtotal" });
            }

            return res.status(200).json({
              message: "Item added and order subtotal updated successfully",
            });
          }
        );
      });
    }
  );
});

router.delete("/delete/:id", (req, res) => {
  const { id } = req.params;

  try {
    const paymentquery = "DELETE FROM items WHERE quotation_id=?";
    db.query(paymentquery, [id], (err, results) => {
      if (err) {
        console.error("error deleting quotation", err);
        return res.status(500).json({ message: "Database Error", error: err });
      }
    });

    const query = "DELETE FROM quotations WHERE id=?";
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error("Error deleting quotation", err);
        return res.status(500).json({ message: "Database Error", error: err });
      }
      res
        .status(200)
        .json({ message: `Quotation with ID ${id} deleted successfully` });
    });
  } catch (error) {
    console.error("error deleting Quotation", error);
    return res
      .status(500)
      .json({ message: "Database Error", error: error.message });
  }
});

router.get("/fetch_items/:selectedQuotation", (req, res) => {
  const { selectedQuotation } = req.params;
  try {
    db.query(
      "SELECT * FROM items WHERE quotation_id = ?",
      [selectedQuotation],
      (err, results) => {
        if (err) {
          console.error("Error fetching items:", err);
          return res
            .status(500)
            .json({ message: "Database Error", error: err });
        }

        return res.status(200).json(results);
      }
    );
  } catch (error) {
    console.error("Error fetching items:", error);
    return res.status(500).json({ message: "Server Error" }); // Adjust the error message as needed
  }
});

router.post("/add_payment", (req, res) => {
  const { amount_payed, quotationId } = req.body;

  const updatePaymentQuery = `
    UPDATE quotations
    SET amount_paid = IFNULL(amount_paid, 0) + ?
    WHERE id = ?;
  `;

  db.query(updatePaymentQuery, [amount_payed, quotationId], (err, result) => {
    if (err) {
      console.error("Error updating payment:", err);
      return res.status(500).json({ message: "Failed to update payment" });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: `Quotation with ID: ${orderId} not found` });
    }

    return res.status(200).json({ message: "Payment added successfully" });
  });
});

router.post(
  "/upload_receipt",
  uploadQuotationReceipts.single("file"),
  (req, res) => {
    const { quotationId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Check if the file already exists
    const checkFileQuery =
      "SELECT * FROM quotation_files WHERE quotation_id = ? AND file_name = ?";

    db.query(
      checkFileQuery,
      [quotationId, file.originalname],
      (err, results) => {
        if (err) {
          console.error("Error checking for existing file:", err);
          return res.status(500).json({ message: "Database error" });
        }

        if (results.length > 0) {
          return res.status(400).json({ message: "File already exists" });
        }

        // File does not exist, proceed with insertion
        const insertQuery =
          "INSERT INTO quotation_files(quotation_id, file_name, file_url) VALUES(?, ?, ?)";

        db.query(
          insertQuery,
          [quotationId, file.originalname, file.path],
          (err, results) => {
            if (err) {
              console.error("Error uploading file:", err);
              return res.status(500).json({ message: "Database Error" });
            }
            return res.status(200).json({
              message: `Receipt Uploaded Successfully for quotation ${quotationId}`,
            });
          }
        );
      }
    );
  }
);

router.get("/fetch_files/:quotationId", (req, res) => {
  const { quotationId } = req.params;

  const query = "SELECT * FROM quotation_files WHERE quotation_id = ?";

  db.query(query, [quotationId], (err, results) => {
    if (err) {
      console.error("Error fetching files:", err);
      return res.status(500).json({ message: "Database Error" });
    }

    res.status(200).json({ files: results });
  });
});

router.delete("/delete_files/:id/:file_url", (req, res) => {
  const { id } = req.params;
  const file_url = decodeURIComponent(req.params.file_url);
  const filePath = file_url;

  const query = "DELETE FROM quotation_files WHERE id=?";
  try {
    db.query(query, [id], (err, result) => {
      if (err) {
        console.error("couldn't delete file from database", err);
        return res.status(500).json({ message: "database error" });
      }

      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("couldn't delete file from filesystem", err);
          return res.status(500).json({ message: "file system error" });
        }
        return res.status(200).json({
          message: `File with id: ${id} successfully deleted`,
        });
      });
    });
  } catch (error) {
    console.error("couldn't delete file", error);
    return res.status(500).json({ message: "database error" });
  }
});

module.exports = router;
