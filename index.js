const express = require("express");
const mongoose = require("mongoose");
const fileUpload = require("express-fileUpload");
require("dotenv").config();
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI);

const userRoutes = require("./routes/user");
app.use(userRoutes);

const offerRoutes = require("./routes/offer");
app.use(offerRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Welcome on my server" });
});

app.all("*", (req, res) => {
  res.status(404).json({ error: "Cette route n'existe pas" });
});

app.listen(process.env.PORT, () => {
  console.log("Server started");
});
