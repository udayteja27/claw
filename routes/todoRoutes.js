// routes/todoRoutes.js
const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../database");
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Middleware to authenticate JWT
function authenticateToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Create a new to-do item
router.post("/", authenticateToken, (req, res) => {
  const { description, status } = req.body;
  const userId = req.user.id;

  db.run(
    `INSERT INTO todos (user_id, description, status) VALUES (?, ?, ?)`,
    [userId, description, status],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Failed to create to-do item" });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

// Get all to-do items for the logged-in user
router.get("/", authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(`SELECT * FROM todos WHERE user_id = ?`, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch to-do items" });
    }
    res.json(rows);
  });
});

// Update a to-do item by ID
router.put("/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { description, status } = req.body;
  const userId = req.user.id;

  db.run(
    `UPDATE todos SET description = ?, status = ? WHERE id = ? AND user_id = ?`,
    [description, status, id, userId],
    function (err) {
      if (err || this.changes === 0) {
        return res.status(500).json({ error: "Failed to update to-do item" });
      }
      res.json({ message: "To-do item updated" });
    }
  );
});

// Delete a to-do item by ID
router.delete("/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.run(
    `DELETE FROM todos WHERE id = ? AND user_id = ?`,
    [id, userId],
    function (err) {
      if (err || this.changes === 0) {
        return res.status(500).json({ error: "Failed to delete to-do item" });
      }
      res.json({ message: "To-do item deleted" });
    }
  );
});

module.exports = router;
