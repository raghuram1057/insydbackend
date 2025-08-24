import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { db, initDB } from "./database.js";

const app = express();
const PORT = process.env.PORT || 4001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize database
initDB()
  .then(() => {
    console.log("✅ Database initialized successfully");
  })
  .catch((err) => {
    console.error("❌ Database initialization error:", err);
  });

// Get all users
app.get("/api/users", (req, res) => {
  db.all("SELECT * FROM users ORDER BY name", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get notifications for a user
app.get("/api/notifications/:userId", (req, res) => {
  const { userId } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  const query = `
    SELECT n.*, u.name as from_user_name 
    FROM notifications n
    LEFT JOIN users u ON n.from_user_id = u.id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
    LIMIT ? OFFSET ?
  `;

  db.all(query, [userId, limit, offset], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get unread notification count
app.get("/api/notifications/:userId/unread-count", (req, res) => {
  const { userId } = req.params;

  db.get(
    "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE",
    [userId],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ unreadCount: row.count });
    }
  );
});

// Mark notification as read
app.put("/api/notifications/:id/read", (req, res) => {
  const { id } = req.params;

  db.run(
    "UPDATE notifications SET is_read = TRUE WHERE id = ?",
    [id],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({
        message: "Notification marked as read",
        changes: this.changes,
      });
    }
  );
});

// Mark all notifications as read for a user
app.put("/api/notifications/user/:userId/read-all", (req, res) => {
  const { userId } = req.params;

  db.run(
    "UPDATE notifications SET is_read = TRUE WHERE user_id = ?",
    [userId],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({
        message: "All notifications marked as read",
        changes: this.changes,
      });
    }
  );
});

// Create a new notification
app.post("/api/notifications", (req, res) => {
  const { user_id, type, title, message, from_user_id } = req.body;

  if (!user_id || !type || !title || !message) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const query = `INSERT INTO notifications (user_id, type, title, message, from_user_id) VALUES (?, ?, ?, ?, ?)`;

  db.run(
    query,
    [user_id, type, title, message, from_user_id || null],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({
        id: this.lastID,
        message: "Notification created successfully",
      });
    }
  );
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
