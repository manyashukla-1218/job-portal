// ================== CONFIG ==================
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// ================== MIDDLEWARE ==================
app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://mern-job-portal-website.vercel.app",
    ],
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  })
);

// ================== BASIC ROUTES ==================
app.get("/", (req, res) => {
  res.send("Job Portal API is running 🚀");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is healthy",
    time: new Date(),
  });
});

// ================== DATABASE ==================
const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const db = client.db("mernJobPortal");

    const jobsCollection = db.collection("jobs");
    const applicationsCollection = db.collection("applications");

    // ================== JOB APIs ==================

    // Create Job
    app.post("/post-job", async (req, res) => {
      const job = {
        ...req.body,
        createdAt: new Date(),
      };

      const result = await jobsCollection.insertOne(job);
      res.send(result);
    });

    // Get All Jobs
    app.get("/all-jobs", async (req, res) => {
      const jobs = await jobsCollection.find({}).toArray();
      res.send(jobs);
    });

    // Get Single Job
    app.get("/all-jobs/:id", async (req, res) => {
      const job = await jobsCollection.findOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(job);
    });

    // Get Jobs by User Email
    app.get("/myJobs/:email", async (req, res) => {
      const jobs = await jobsCollection
        .find({ postedBy: req.params.email })
        .toArray();
      res.send(jobs);
    });

    // Update Job
    app.patch("/update-job/:id", async (req, res) => {
      const result = await jobsCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: req.body },
        { upsert: true }
      );
      res.send(result);
    });

    // Delete Job
    app.delete("/job/:id", async (req, res) => {
      const result = await jobsCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });

    // ================== APPLY JOB API ==================
    app.post("/job/:id/apply", async (req, res) => {
      const application = {
        jobId: new ObjectId(req.params.id),
        email: req.body.email,
        resumeLink: req.body.resumeLink,
        appliedAt: new Date(),
      };

      const result = await applicationsCollection.insertOne(application);
      res.send({
        message: "Application submitted successfully ✅",
        result,
      });
    });

    // ================== DB PING ==================
    await client.db("admin").command({ ping: 1 });
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error(error);
  }
}

run();

// ================== SERVER ==================
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
