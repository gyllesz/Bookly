import express from "express";
import axios from "axios";
// import pg from "pg";
import dotenv from "dotenv";
import { render } from "ejs";
import itemsPool from './DBConfig.js';


// Load environment variables
dotenv.config();

const app = express();
const port = 3000;

// // Database connection configuration
// const db = new pg.Client({
//     user: process.env.DB_USER,
//     host: process.env.DB_HOST,
//     database: process.env.DB_NAME,
//     password: process.env.DB_PASSWORD,
//     port: process.env.DB_PORT,
// });

// // Connect to the database
// db.connect();

// Middleware configuration
app.use(express.urlencoded({ extended: true })); // For parsing URL-encoded data
app.use(express.json());
app.use(express.static("public")); // Serve static files from the "public" directory


// Global variable to track the current user session
let currentUser = null;

/**
 * Fetch and process reviews from the database
 * Limits the review text to 50 words
 */
const fetchAndProcessReviews = async () => {
    try {
        const threads = await itemsPool.query("SELECT * FROM threads JOIN users ON user_id = id;");
        threads.rows.forEach(review => {
            review.review = review.review.split(' ').slice(0, 33).join(' ') + (review.review.split(' ').length > 50 ? '...' : '');
            review.time_added = review.time_added.toISOString().split('T')[0]; // Formats as YYYY-MM-DD
        });
        return threads.rows;
    } catch (err) {
        console.error("Error fetching reviews:", err);
        throw new Error("Failed to fetch reviews");
    }
};

// Login Page
app.get("/", (req, res) => {
    res.render("auth.ejs", { pageTitle: "Log In", action: "/login" });
});

// Sign-In Page
app.get("/signin", (req, res) => {
    res.render("auth.ejs", { pageTitle: "Sign In", action: "/signin" });
});

// Logout
app.get("/logout", (req, res) => {
    currentUser = null;
    res.redirect("/");
});

// Handle Sign-In
app.post("/signin", async (req, res) => {
    const { username, password, confirmPassword } = req.body;

    if (!username || !password) return res.status(400).send("Username and password are required");
    if (password !== confirmPassword) return res.status(400).send("Passwords do not match");

    try {
        await itemsPool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, password]);
        res.redirect("/");
    } catch (err) {
        console.error("Error during sign-in:", err);
        if (err.code === "23505") res.status(400).send("Username already exists");
        else console.error("Error during sign-in:", err);
    }
});

// Handle Login
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) return res.status(400).send("Username and password are required");

    try {
        const result = await itemsPool.query("SELECT * FROM users WHERE username = $1", [username]);
        const user = result.rows[0];

        if (!user || user.password !== password) return res.status(400).send("Invalid username or password");

        currentUser = { id: user.id, username: user.username };
        const reviews = await fetchAndProcessReviews();
        res.render("index.ejs", { reviews, currentUser });
    } catch (err) {
        res.status(500).send("Internal server error");
    }
});

// Home Page
app.get("/home", async (req, res) => {
    try {
        const reviews = await fetchAndProcessReviews();
        res.render("index.ejs", { reviews, currentUser });
    } catch (err) {
        console.error("Error fetching reviews:", err);
        res.status(500).send("Server error");
    }
});

app.get("/sort", async (req, res) => {
    const sortBy = req.query["sort-by"];
    const validSortFields = ["title", "rating", "date"];
    const fieldMap = {
        title: "bookTitle",
        rating: "rating",
        date: "time_added"
    };

    if (!validSortFields.includes(sortBy)) {
        return res.status(400).send("Invalid sort field");
    }

    try {
        const query = `
            SELECT threads.*, users.username 
            FROM threads 
            JOIN users ON threads.user_id = users.id 
            ORDER BY ${fieldMap[sortBy]} ASC;
        `;
        const { rows: reviews } = await itemsPool.query(query);
        reviews.forEach(review => {
            review.review = review.review.split(' ').slice(0, 33).join(' ') + (review.review.split(' ').length > 50 ? '...' : '');
            review.time_added = review.time_added.toISOString().split('T')[0]; // Format date
        });
        res.render("index.ejs", { reviews, currentUser });
    } catch (err) {
        console.error("Error sorting reviews:", err);
        res.status(500).send("Server error");
    }
});

app.get("/reviews", async (req, res) => {
    if (!currentUser) {
        return res.redirect("/login");
    }

    try {
        const query = `
            SELECT threads.*, users.username 
            FROM threads 
            JOIN users ON threads.user_id = users.id 
            WHERE user_id = $1
            ORDER BY time_added DESC;
        `;
        const { rows: reviews } = await itemsPool.query(query, [currentUser.id]);
        reviews.forEach(review => {
            review.time_added = review.time_added.toISOString().split('T')[0]; // Format date
        });
        res.render("index.ejs", { reviews, currentUser });
    } catch (err) {
        console.error("Error fetching user's reviews:", err);
        res.status(500).send("Server error");
    }
});


// Search for books using Google Books API
app.post("/search", async (req, res) => {
    const query = req.body.title;
    const encodedQuery = encodeURIComponent(query).replace(/%20/g, "+");

    try {
        const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&key=${process.env.API_KEY}`);
        const books = response.data.items.map(item => {
            const { volumeInfo, saleInfo } = item;
            return {
                title: volumeInfo.title || "No title available",
                authors: volumeInfo.authors?.join(", ") || "Unknown author",
                publishedDate: volumeInfo.publishedDate || "Unknown date",
                description: volumeInfo.description || "No description available",
                categories: volumeInfo.categories?.join(", ") || "No categories",
                averageRating: volumeInfo.averageRating || "No rating",
                thumbnail: volumeInfo.imageLinks?.thumbnail || "No image available",
                price: saleInfo?.retailPrice?.amount || "Not available",
                buyLink: saleInfo?.buyLink || "Not available",
            };
        });
        res.render("results.ejs", { books, currentUser });
    } catch (err) {
        res.status(500).send("Failed to fetch data from Google Books API");
    }
});

// Render Create Review Page
app.post("/create-review", (req, res) => {
    const book = JSON.parse(req.body.book);
    res.render("create.ejs", { selectedBook: book, currentUser });
});

app.post("/submit-review", async (req, res) => {
    const { rating, reviewContent, book } = req.body;
    const selectedBook = JSON.parse(book);

    try {
        await itemsPool.query(
            "INSERT INTO threads (rating, review, user_id, bookTitle, thumbnail) VALUES ($1, $2, $3, $4, $5)",
            [rating, reviewContent, currentUser.id, selectedBook.title, selectedBook.thumbnail]
        );
        res.redirect("/home");
    } catch (err) {
        console.error("Error submitting review:", err);
        res.status(500).send("Error submitting review");
    }
});


app.get("/view-review", async (req, res) => {
    const reviewId = req.query.reviewId;
    try {
        const result = await itemsPool.query("SELECT * FROM threads JOIN users ON user_id = id WHERE thread_id = $1", [reviewId]);
        const review = result.rows[0];
        res.render("view_review.ejs", { review, currentUser });
    } catch (err) {
        res.status(500).send("Error fetching review details");
    }
});

// Render Edit Review Page
app.get("/edit-review", async (req, res) => {
    const reviewId = req.query.reviewId;
    try {
        const result = await itemsPool.query("SELECT * FROM threads WHERE thread_id = $1", [reviewId]);
        const review = result.rows[0];
        res.render("edit.ejs", {
            selectedBook: { title: review.booktitle, thumbnail: review.thumbnail },
            reviewContent: review.review,
            rating: review.rating,
            reviewId,
            currentUser,
        });
    } catch (err) {
        res.status(500).send("Error fetching review details");
    }
});

app.post("/update-review", async (req, res) => {
    const { reviewId, rating, reviewContent } = req.body;

    try {
        await itemsPool.query(
            "UPDATE threads SET rating = $1, review = $2 WHERE thread_id = $3",
            [rating, reviewContent, reviewId]
        );
        res.redirect("/home");
    } catch (err) {
        console.error("Error updating review:", err);
        res.status(500).send("Error updating review");
    }
});


// Delete Review
app.post("/delete-review", async (req, res) => {
    const { reviewId   } = req.body;
    try {
        await itemsPool.query("DELETE FROM threads WHERE thread_id = $1", [reviewId]);
        res.redirect("/home");
    } catch (err) {
        console.error("Error deleting review:", err);
        res.status(500).send("Failed to delete review");
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
