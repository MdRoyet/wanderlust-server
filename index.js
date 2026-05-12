require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();

// Middleware
app.use(express.json());

// Enable CORS (Cross-Origin Resource Sharing)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept",
  );
  next();
});

// Custom DNS settings for MongoDB connection issues in some environments
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const PORT = process.env.PORT || 5000;
const uri = process.env.URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server
    await client.connect();

    // Initialize Database and Collections
    const db = client.db(process.env.DB_NAME);
    const destinationCollection = db.collection("destinations");

    // Routes
    app.post("/destinations", async (req, res) => {
      try {
        const destination = req.body;
        const result = await destinationCollection.insertOne(destination);
        res.status(201).send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to add destination", error });
      }
    });

    app.get("/destinations", async (req, res) => {
      try {
        const destinations = await destinationCollection.find().toArray();
        res.status(200).send(destinations);
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch destinations", error });
      }
    });

    app.get("/", (req, res) => {
      res.send("Wanderlust Server is running!");
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      `Pinged your deployment. You successfully connected to MongoDB! Database: ${process.env.DB_NAME}`,
    );
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
  }
}
run().catch(console.dir);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
