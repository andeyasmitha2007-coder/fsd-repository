import express from "express";
import { MongoClient, ObjectId } from "mongodb";

const app = express();
const port = process.env.PORT || 7000;

// MongoDB connection using environment variables
const mongoUrl = process.env.MONGODB_URI;
const databaseName = process.env.DATABASE_NAME || "library_db";

if (!mongoUrl) {
  console.error("MONGODB_URI environment variable is missing");
  process.exit(1);
}

const client = new MongoClient(mongoUrl);

let db;

try {
  await client.connect();
  db = client.db(databaseName);
  console.log("Connected to MongoDB successfully");
} catch (err) {
  console.error("Failed to connect to MongoDB:", err.message);
  process.exit(1);
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper to handle errors in async routes
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Validate MongoDB ObjectId
const isValidId = (id) => ObjectId.isValid(id) && String(new ObjectId(id)) === id;

// CREATE a new book
app.post("/api/v1/books", asyncHandler(async (req, res) => {
  const { title, author, category, price } = req.body;

  if (!title || !author || !category || price === undefined || price === null || price === "") {
    return res.status(400).json({
      message: "All book fields are required"
    });
  }

  const result = await db.collection("books").insertOne({
    title,
    author,
    category,
    price
  });

  res.status(201).json({
    message: "Book created successfully",
    data: {
      _id: result.insertedId,
      title,
      author,
      category,
      price
    }
  });
}));

// GET all books or filter by category
app.get("/api/v1/books", asyncHandler(async (req, res) => {
  const category = req.query.category;
  const query = category ? { category } : {};

  const books = await db.collection("books").find(query).toArray();

  res.status(200).json({
    message: "Books fetched successfully",
    data: books
  });
}));

// GET a single book by ID
app.get("/api/v1/books/:id", asyncHandler(async (req, res) => {
  const bookId = req.params.id;

  if (!isValidId(bookId)) {
    return res.status(400).json({ message: "Invalid book ID" });
  }

  const book = await db.collection("books").findOne({
    _id: new ObjectId(bookId)
  });

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  res.status(200).json({
    message: "Book fetched successfully",
    data: book
  });
}));

// UPDATE a book by ID
app.put("/api/v1/books/:id", asyncHandler(async (req, res) => {
  const bookId = req.params.id;
  const { title, author, category, price } = req.body;

  if (!isValidId(bookId)) {
    return res.status(400).json({ message: "Invalid book ID" });
  }

  if (!title || !author || !category || price === undefined || price === null || price === "") {
    return res.status(400).json({
      message: "All book fields are required"
    });
  }

  const book = { title, author, category, price };

  const result = await db.collection("books").updateOne(
    { _id: new ObjectId(bookId) },
    { $set: book }
  );

  if (result.matchedCount === 0) {
    return res.status(404).json({ message: "Book not found" });
  }

  res.status(200).json({
    message: "Book updated successfully",
    data: { _id: new ObjectId(bookId), ...book }
  });
}));

// DELETE a book by ID
app.delete("/api/v1/books/:id", asyncHandler(async (req, res) => {
  const bookId = req.params.id;

  if (!isValidId(bookId)) {
    return res.status(400).json({ message: "Invalid book ID" });
  }

  const result = await db.collection("books").deleteOne({
    _id: new ObjectId(bookId)
  });

  if (result.deletedCount === 0) {
    return res.status(404).json({ message: "Book not found" });
  }

  res.status(200).json({
    message: "Book deleted successfully"
  });
}));

// 404 middleware
app.use((req, res) => {
  res.status(404).json({
    message: "Not Found"
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error"
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});