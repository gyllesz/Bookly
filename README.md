# Bookly Documentation

Welcome to **Bookly**! This project is a book review web app that allows users to search for books, write reviews, edit them, and view reviews written by others. Please note that the website was made in a rush, so there may be some rough edges. Below you'll find all the necessary information to understand, run, and contribute to this project.

---

## Table of Contents

1. [Features](#features)
2. [Technologies Used](#technologies-used)
3. [Setup and Installation](#setup-and-installation)
4. [How to Run the Project](#how-to-run-the-project)
5. [Building the Database](#building-the-database)
6. [Folder Structure](#folder-structure)
7. [Contributing](#contributing)

---

## Features

- User authentication for login and sign-in.
- Search books using Google Books API.
- Write, edit, and delete book reviews.
- Sort reviews by title, rating, or date.
- Responsive design for improved user experience.

---

## Technologies Used

- **Backend**: Node.js, Express.js, PostgreSQL
- **Frontend**: EJS templates, CSS
- **Database**: PostgreSQL
- **API**: Google Books API
- **Environment Variables**: dotenv

---

## Setup and Installation

Follow these steps to set up and run the project:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/<your-username>/bookly.git
   cd bookly
   ```

2. **Install Dependencies**:
   Make sure you have Node.js and npm installed, then run:
   ```bash
   npm install
   ```

3. **Set Up the Database**:
   - Install PostgreSQL and create a new database.
   - Update the `.env` file with your database credentials:
     ```env
     DB_USER=<your-database-username>
     DB_HOST=localhost
     DB_NAME=<your-database-name>
     DB_PASSWORD=<your-database-password>
     DB_PORT=5432
     API_KEY=<your-google-books-api-key>
     ```

4. **Run the Server**:
   ```bash
   nodemon index.js
   ```

5. **Access the Application**:
   Open your browser and navigate to `http://localhost:3000`.

---

## How to Run the Project

If you've forked the repository:

1. Fork the repository on GitHub.
2. Clone your forked repository:
   ```bash
   git clone https://github.com/<your-username>/bookly.git
   cd bookly
   ```
3. Follow the [Setup and Installation](#setup-and-installation) instructions starting on Step 2.

---

## Building the Database

To build the database, follow these steps:

1. **Create the `users` Table**:
   ```sql
   CREATE TABLE users (
       id SERIAL PRIMARY KEY,
       username VARCHAR(50) UNIQUE NOT NULL,
       password VARCHAR(255) NOT NULL
   );
   ```

2. **Create the `threads` Table**:
   ```sql
   CREATE TABLE threads (
       thread_id SERIAL PRIMARY KEY,
       rating SMALLINT NOT NULL,
       review TEXT NOT NULL,
       user_id INTEGER NOT NULL REFERENCES users(id),
       time_added DATE NOT NULL,
       thumbnail TEXT NOT NULL,
       booktitle TEXT NOT NULL
   );
   ```

3. **Insert Sample Data** (Optional):
   Add sample users and threads for testing purposes.
   ```sql
   INSERT INTO users (username, password) VALUES ('testuser', 'password123');

   INSERT INTO threads (rating, review, user_id, time_added, thumbnail, booktitle)
   VALUES (5, 'Great book!', 1, CURRENT_DATE, 'https://example.com/image.jpg', 'Sample Book');
   ```

---

## Folder Structure

```
Bookly
├── views
│   ├── partials
│   │   ├── header.ejs
│   │   └── footer.ejs
│   ├── auth.ejs
│   ├── create.ejs
│   ├── edit.ejs
│   ├── index.ejs
│   ├── results.ejs
│   └── view_review.ejs
├── public
│   ├── styles
│   │   ├── main.css
│   │   └── auth.css
├── .env
├── index.js
├── package.json
└── README.md
```

---

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature/new-feature
   ```
3. Make your changes and commit them:
   ```bash
   git commit -m "Add new feature"
   ```
4. Push to your forked repository:
   ```bash
   git push origin feature/new-feature
   ```
5. Open a pull request on the main repository.

---

Thank you for checking Bookly! Feel free to contact me if you have any questions or suggestions.

