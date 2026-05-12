require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();

// Middleware
app.use(express.json());

// Enable CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept",
  );
  next();
});

// Custom DNS settings
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const PORT = process.env.PORT || 5000;
const uri = process.env.URI;

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
    const db = client.db(process.env.DB_NAME);
    const destinationCollection = db.collection("destinations");
    const bookingCollection = db.collection("bookings");

    // DESTINATIONS
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

    app.get("/destinations/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await destinationCollection.findOne(query);
        if (result) res.status(200).send(result);
        else res.status(404).send({ message: "Destination not found" });
      } catch (error) {
        res.status(500).send({ message: "Invalid ID format", error });
      }
    });

    app.put("/destinations/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;
        delete updatedData._id;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = { $set: updatedData };
        const result = await destinationCollection.updateOne(filter, updateDoc);
        res.status(200).send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to update", error });
      }
    });

    app.delete("/destinations/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await destinationCollection.deleteOne(query);
        res.status(200).send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to delete", error });
      }
    });

    // BOOKINGS
    app.post("/bookings", async (req, res) => {
      try {
        const booking = req.body;
        const result = await bookingCollection.insertOne(booking);
        res.status(201).send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to create booking", error });
      }
    });

    app.get("/bookings", async (req, res) => {
      try {
        const bookings = await bookingCollection.find().toArray();
        res.status(200).send(bookings);
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch bookings", error });
      }
    });

    app.delete("/bookings/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await bookingCollection.deleteOne(query);
        res.status(200).send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to cancel booking", error });
      }
    });

    app.get("/", (req, res) => {
      res.send("Wanderlust Server is running!");
    });

    await client.db("admin").command({ ping: 1 });
    console.log(`Pinged MongoDB! Connected to: ${process.env.DB_NAME}`);
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
  }
}
run().catch(console.dir);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
