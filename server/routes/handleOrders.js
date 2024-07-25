const express = require("express");
const db = require("../db");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const router = express.Router();

router.post("/new_order", (req, res) => {
  const { supplier_id, supplier_name, created_by } = req.body;

  const insertQuery =
    "INSERT INTO orders (supplier_id, supplier_name, created_by, order_number, date_created, status) VALUES (?, ?, ?, ?, CURDATE(), ?)";

  db.query(
    insertQuery,
    [supplier_id, supplier_name, created_by, 0, "pending"],
    (err, result) => {
      if (err) {
        console.error("Error inserting new order:", err);
        return res.status(500).send({ message: "Error inserting new order" });
      }

      const orderId = result.insertId;
      const orderNumber = `ON.${orderId}`;

      const updateQuery = "UPDATE orders SET order_number = ? WHERE id = ?";

      db.query(updateQuery, [orderNumber, orderId], (err, updateResult) => {
        if (err) {
          console.error("Error updating order number:", err);
          return res
            .status(500)
            .send({ message: "Error updating order number" });
        }

        res.status(201).send({
          message: "Order created successfully",
          order_id: orderId,
          order_number: orderNumber,
        });
      });
    }
  );
});

router.get("/fetch_orders", (req, res) => {
  const { location, startDate, endDate } = req.query;
  let query = "SELECT * FROM orders WHERE 1=1";
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

    const ordersWithDetails = results.map((order) => {
      const dateCreated = dayjs
        .utc(order.date_created)
        .tz("Asia/Dubai")
        .format("YYYY-MM-DD");

      const pending_payment = Math.max(
        0,
        order.subtotal - (order.amount_payed || 0)
      );
      const status =
        pending_payment <= 0 && order.subtotal > 0 ? "finished" : order.status;

      return {
        ...order,
        date_created: dateCreated,
        pending_payment,
        status,
      };
    });

    res.status(200).json(ordersWithDetails);
  });
});

router.put("/cancel/:id", (req, res) => {
  const { id } = req.params;
  try {
    const query = "UPDATE orders SET status = 'canceled' WHERE id=?";
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error("Error updating order status", err);
        return res.status(500).json({ message: "Database Error", error: err });
      }
      if (results.affectedRows === 0) {
        return res
          .status(404)
          .json({ message: `Order with ID: ${id} not found` });
      }
      return res
        .status(200)
        .json({ message: `Order with ID: ${id} canceled successfully` });
    });
  } catch (error) {
    console.error("Error canceling Order", error);
    return res
      .status(500)
      .json({ message: "Database error", error: error.message });
  }
});

router.post("/newitem", (req, res) => {
  const { orderId, item_name, item_description, price, quantity } = req.body;

  // Insert the new item into the order_items table
  const insertItemQuery = `
      INSERT INTO order_items (order_id, item_name, item_description, price, quantity)
      VALUES (?, ?, ?, ?, ?)
  `;
  db.query(
    insertItemQuery,
    [orderId, item_name, item_description, price, quantity],
    (err, result) => {
      if (err) {
        console.error("Error inserting new item:", err);
        return res.status(500).json({ message: "Failed to add new item" });
      }

      // Calculate the new subtotal
      const calculateSubtotalQuery = `
          SELECT SUM(total) AS subtotal FROM order_items WHERE order_id = ?
      `;
      db.query(calculateSubtotalQuery, [orderId], (err, result) => {
        if (err) {
          console.error("Error calculating subtotal:", err);
          return res
            .status(500)
            .json({ message: "Failed to calculate subtotal" });
        }

        const newSubtotal = result[0].subtotal;

        // Update the order's subtotal
        const updateOrderQuery = `
              UPDATE orders SET subtotal = ? WHERE id = ?
          `;
        db.query(updateOrderQuery, [newSubtotal, orderId], (err, result) => {
          if (err) {
            console.error("Error updating order subtotal:", err);
            return res
              .status(500)
              .json({ message: "Failed to update order subtotal" });
          }

          return res.status(200).json({
            message: "Item added and order subtotal updated successfully",
          });
        });
      });
    }
  );
});

router.delete("/delete/:id", (req, res) => {
  const { id } = req.params;

  try {
    const paymentquery = "DELETE FROM order_items WHERE order_id=?";
    db.query(paymentquery, [id], (err, results) => {
      if (err) {
        console.error("error deleting order", err);
        return res.status(500).json({ message: "Database Error", error: err });
      }
    });

    const query = "DELETE FROM orders WHERE id=?";
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error("Error deleting order", err);
        return res.status(500).json({ message: "Database Error", error: err });
      }
      res
        .status(200)
        .json({ message: `order with ID ${id} deleted successfully` });
    });
  } catch (error) {
    console.error("error deleting order", error);
    return res
      .status(500)
      .json({ message: "Database Error", error: error.message });
  }
});

router.get("/fetch_items/:selectedOrder", (req, res) => {
  const { selectedOrder } = req.params;
  try {
    db.query(
      "SELECT * FROM order_items WHERE order_id = ?",
      [selectedOrder],
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
  const { amount_payed, orderId } = req.body;

  const updatePaymentQuery = `
    UPDATE orders 
    SET amount_payed = IFNULL(amount_payed, 0) + ?
    WHERE id = ?;
  `;

  db.query(updatePaymentQuery, [amount_payed, orderId], (err, result) => {
    if (err) {
      console.error("Error updating payment:", err);
      return res.status(500).json({ message: "Failed to update payment" });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: `Order with ID: ${orderId} not found` });
    }

    return res.status(200).json({ message: "Payment added successfully" });
  });
});

module.exports = router;
