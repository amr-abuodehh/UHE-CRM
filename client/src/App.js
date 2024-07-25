import React from "react";
import Navbar from "./componenets/Navbar";
import { Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage";
import Suppliers from "./pages/Suppliers";
import CreateSupplier from "./pages/CreateSupplier";
import { Register } from "./pages/Register";
import Login from "./pages/Login";
import withAuth from "./componenets/withAuth";
import { useAuth } from "./AuthContext";
import Clients from "./pages/Clients";
import CreateClients from "./pages/CreateClients";
import NewQuotationItem from "./pages/NewQuotationItem";
import Quotations from "./pages/Quotations";
import CreateExitFrom from "./pages/CreateExitFrom";
import ExitForms from "./pages/ExitForms";
import LeaveForms from "./pages/LeaveForms";
import CreateLeaveForm from "./pages/CreateLeaveForm";
import Tasks from "./pages/Tasks";
import CreateTask from "./pages/CreateTask";
import Orders from "./pages/Orders";

const ProtectedHomepage = withAuth(Homepage);
const ProtectedSuppliers = withAuth(Suppliers);
const ProtectedCreateSupplier = withAuth(CreateSupplier);
const ProtectedRegister = withAuth(Register);
const ProtectedClients = withAuth(Clients);
const ProtectedCreateClients = withAuth(CreateClients);
const ProtectedNewQuotationItem = withAuth(NewQuotationItem);
const ProtectedQuotations = withAuth(Quotations);
const ProtectedCreateExitForm = withAuth(CreateExitFrom);
const ProtectedExitForms = withAuth(ExitForms);
const ProtectedCreateLeaveForm = withAuth(CreateLeaveForm);
const ProtectedLeaveForms = withAuth(LeaveForms);
const ProtectedTasks = withAuth(Tasks);
const ProtectedCreateTask = withAuth(CreateTask);
const ProtectedOrders = withAuth(Orders);

function App() {
  const { accessToken } = useAuth();
  return (
    <>
      {accessToken && <Navbar />}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/homepage" element={<ProtectedHomepage />} />
        <Route path="/register" element={<ProtectedRegister />} />
        <Route path="/suppliers" element={<ProtectedSuppliers />} />
        <Route path="/orders" element={<ProtectedOrders />} />
        <Route path="/create_supplier" element={<ProtectedCreateSupplier />} />
        <Route path="/clients" element={<ProtectedClients />} />
        <Route path="/create_clients" element={<ProtectedCreateClients />} />
        <Route path="/quotations" element={<ProtectedQuotations />} />
        <Route path="/new_item" element={<ProtectedNewQuotationItem />} />
        <Route path="/create_exit_form" element={<ProtectedCreateExitForm />} />
        <Route path="/create_task" element={<ProtectedCreateTask />} />
        <Route path="/tasks" element={<ProtectedTasks />} />
        <Route path="/exit_forms" element={<ProtectedExitForms />} />

        <Route
          path="/create_leave_form"
          element={<ProtectedCreateLeaveForm />}
        />
        <Route path="/leave_forms" element={<ProtectedLeaveForms />} />
      </Routes>
    </>
  );
}

export default App;
