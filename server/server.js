const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;
const db = require("./db");
const suppliersRoute = require("./routes/handleSuppliers");
const usersRoute = require("./routes/handleUsers");
const clientsRoute = require("./routes/handleClients");
const quotationsRoute = require("./routes/handleQuotations");
const tasksRoute = require("./routes/handleTasks");
const hrRoute = require("./routes/handleHr");
const OrderRoute = require("./routes/handleOrders");
const homeRoute = require("./routes/handleHome");
const cookieParser = require("cookie-parser");
const path = require("path");
const jwt = require("jsonwebtoken");
const {
  authenticateToken,
  authorizeAdmin,
  authorizeAdminOrManager,
} = require("./middleware/authMiddleware");

app.use(cookieParser());

app.use(express.json());
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/suppliers", authenticateToken, suppliersRoute);
app.use("/api/users", usersRoute);
app.use("/api/clients", authenticateToken, clientsRoute);
app.use("/api/quotations", authenticateToken, quotationsRoute);
app.use("/api/hr", authenticateToken, hrRoute);
app.use("/api/tasks", authenticateToken, tasksRoute);
app.use("/api/orders", authenticateToken, OrderRoute);
app.use("/api/home", homeRoute);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
