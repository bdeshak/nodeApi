import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import "./passport.js";
import { dbConnect } from "./mongo/index.js";
import { meRoutes, authRoutes } from "./routes/index.js";
import path from "path";
import * as fs from "fs";
import cron from "node-cron";
import ReseedAction from "./mongo/ReseedAction.js";
const mongoose = require('mongoose');

// MongoDB Atlas connection URI
const uri = 'mongodb+srv://bdeshak:Mlpnkobj@cluster0.cvl8ljb.mongodb.net/?retryWrites=true&w=majority';

// Mongoose connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // Add more options as needed (e.g., ssl, auth, etc.)
};

// Connect to MongoDB Atlas
mongoose.connect(uri, options)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    
    // Once connected, you can start defining and using your mongoose models here
    
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB Atlas:', error);
  });

// Gracefully handle process termination
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB Atlas connection closed');
    process.exit(0);
  } catch (err) {
    console.error('Error closing MongoDB Atlas connection:', err);
    process.exit(1);
  }
});

dotenv.config();

const PORT = process.env.PORT || 8080;
const app = express();

const whitelist = [process.env.APP_URL_CLIENT];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

dbConnect();

app.use(cors(corsOptions));
app.use(bodyParser.json({ type: "application/vnd.api+json", strict: false }));

app.get("/", function (req, res) {
  const __dirname = fs.realpathSync(".");
  res.sendFile(path.join(__dirname, "index.html"));
});

app.use("/", authRoutes);
app.use("/me", meRoutes);

if (process.env.SCHEDULE_HOUR) {
  cron.schedule(`0 */${process.env.SCHEDULE_HOUR} * * *'`, () => {
    ReseedAction();
  });
}

app.listen(PORT, () => console.log(`Server listening to port ${PORT}`));
