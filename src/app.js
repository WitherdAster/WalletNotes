require('dotenv').config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const expenseRoutes = require("./routes/expenseRoutes");


const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

/*
ROUTES
*/
app.use("/api", authRoutes);
app.use("/api", expenseRoutes);

/*
TEST API
*/
app.get("/api/test", (req, res) => {
  res.json({
    message: "API berjalan"
  });
});

/*
START SERVER
*/
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
