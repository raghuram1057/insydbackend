import sqlite3pkg from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const sqlite3 = sqlite3pkg.verbose();

// __dirname and __filename are not available in ES modules by default.
// You need to recreate them:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create database connection
const dbPath = path.join(__dirname, "insyd.db");
const db = new sqlite3.Database(dbPath);

// Initialize database schema
const initDB = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Notifications table
      db.run(`CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        from_user_id INTEGER,
        is_read BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (from_user_id) REFERENCES users (id)
      )`);

      // Insert sample users
      const users = [
        ["John Architect", "john@example.com"],
        ["Sarah Designer", "sarah@example.com"],
        ["Mike Builder", "mike@example.com"],
        ["Lisa Planner", "lisa@example.com"],
      ];

      const stmt = db.prepare(
        `INSERT OR IGNORE INTO users (name, email) VALUES (?, ?)`
      );
      users.forEach((user) => {
        stmt.run(user);
      });
      stmt.finalize();

      // Insert sample notifications
      const sampleNotifications = [
        [1, "follow", "New Follower", "Sarah Designer started following you", 2],
        [1, "like", "Post Liked", 'Mike Builder liked your blog post "Modern Architecture Trends"', 3],
        [2, "comment", "New Comment", "John Architect commented on your design portfolio", 1],
        [2, "job", "Job Opportunity", "New architect position at Green Buildings Corp", null],
        [3, "follow", "New Follower", "Lisa Planner started following you", 4],
        [3, "like", "Post Liked", "John Architect liked your construction update", 1],
      ];

      const notifStmt = db.prepare(
        `INSERT OR IGNORE INTO notifications (user_id, type, title, message, from_user_id) VALUES (?, ?, ?, ?, ?)`
      );
      sampleNotifications.forEach((notif) => {
        notifStmt.run(notif);
      });
      notifStmt.finalize(() => {
        resolve();
      });
    });
  });
};

export { db, initDB };
