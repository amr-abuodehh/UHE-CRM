export const registerFormConfig = [
  { type: "text", label: "Username", name: "username", required: true },
  { type: "email", label: "Email", name: "email", required: true },
  { type: "password", label: "Password", name: "password", required: true },
  {
    type: "select",
    label: "Privilege",
    name: "privilege",
    options: ["user", "manager", "sales", "admin"],
  },
];

export const createClientFormConfig = [
  { type: "text", label: "Name", name: "name", required: true },
  { type: "text", label: "Company", name: "company", required: true },
  { type: "text", label: "Website", name: "website", required: true },
  { type: "email", label: "Email", name: "email", required: true },
  { type: "tel", label: "Phone Number", name: "phone", required: true },
  {
    type: "select",
    label: "Location",
    name: "location",
    options: [
      "Abu Dhabi",
      "AL-Ain",
      "AL-Sharja",
      "Dubai",
      "Ajman",
      "Ras AL Khayma",
      "Umm Al Quwain",
    ],
    required: true,
  },
];

export const createSupplierFormConfig = [
  { type: "text", label: "Name", name: "name", required: true },
  { type: "text", label: "Company", name: "company", required: true },
  { type: "text", label: "Website", name: "website", required: true },
  { type: "email", label: "Email", name: "email", required: true },
  { type: "tel", label: "Phone Number", name: "phone", required: true },
  {
    type: "textarea",
    label: "Description",
    name: "desc",
    required: true,
    rows: 3,
  },
  {
    type: "select",
    label: "Location",
    name: "location",
    required: true,
    options: [
      "Abu Dhabi",
      "AL-Ain",
      "AL-Sharja",
      "Dubai",
      "Ajman",
      "Ras AL Khayma",
      "Umm Al Quwain",
    ],
  },
];

export const loginFormConfig = [
  { type: "text", label: "Username", name: "username", required: true },
  { type: "password", label: "Password", name: "password", required: true },
];

export const newItemFormConfig = [
  { type: "text", label: "Item", name: "item_name", required: true },
  {
    type: "textarea",
    label: "Item Description",
    name: "item_description",
    required: true,
  },
  { type: "number", label: "Price", name: "price", required: true },
  { type: "number", label: "Quantity", name: "quantity", required: true },
];
export const exitFormConfig = [
  { type: "text", label: "Name", name: "name", required: true },
  { type: "text", label: "Designation", name: "designation", required: true },
  { type: "text", label: "Department", name: "department", required: true },
  { type: "time", label: "From Time", name: "from_time", required: true },
  { type: "time", label: "To Time", name: "to_time", required: true },
  {
    type: "textarea",
    label: "Reason",
    name: "reason",
    required: true,
    rows: 3,
  },
];
export const exitFormConfigHr = [
  { type: "text", label: "Name", name: "name", required: true },
  { type: "text", label: "Designation", name: "designation", required: true },
  { type: "text", label: "Department", name: "department", required: true },
  { type: "time", label: "From Time", name: "from_time", required: true },
  { type: "time", label: "To Time", name: "to_time", required: true },
  {
    type: "textarea",
    label: "Reason",
    name: "reason",
    required: true,
    rows: 3,
  },
];
export const leaveFormConfig = [
  { type: "text", label: "Name", name: "name", required: true },
  { type: "text", label: "Designation", name: "designation", required: true },
  {
    type: "text",
    label: "Employee Number",
    name: "employee_number",
    required: true,
  },
  { type: "date", label: "Joining Date", name: "joining_date", required: true },
  { type: "text", label: "Department", name: "department", required: true },
  {
    type: "text",
    label: "Type_of_leave",
    name: "type_of_leave",
    required: true,
  },
  { type: "date", label: "Start Date", name: "start_date", required: true },
  { type: "date", label: "Return Date", name: "return_date", required: true },
  {
    type: "number",
    label: "Number of Days",
    name: "number_of_days",
    required: true,
  },
];
export const paymentFormConfig = [
  {
    type: "number",
    label: "Payment Amount",
    name: "amount_payed",
    required: true,
  },
];
export const taskFormConfig = [
  { type: "text", label: "Task", name: "task", required: true },
  { type: "text", label: "Details", name: "details", required: true },
  { type: "date", label: "Deadline", name: "deadline", required: true },
];
export const orderItemFormConfig = [
  { type: "text", label: "Item Name", name: "item_name", required: true },
  {
    type: "text",
    label: "Item Description",
    name: "item_description",
    required: true,
  },
  {
    type: "number",
    label: "Price",
    name: "price",
    required: true,
    step: "0.01",
  },
  {
    type: "number",
    label: "Quantity",
    name: "quantity",
    required: true,
    step: "1",
  },
];
