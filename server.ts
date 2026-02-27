import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

const db = new Database("friendlytime.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK(role IN ('customer', 'friend')) NOT NULL,
    city TEXT,
    age INTEGER,
    languages TEXT,
    interests TEXT,
    about TEXT,
    hourly_rate INTEGER,
    verified INTEGER DEFAULT 0,
    rating REAL DEFAULT 5.0
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    friend_id INTEGER,
    activity TEXT,
    duration TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(customer_id) REFERENCES users(id),
    FOREIGN KEY(friend_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER,
    receiver_id INTEGER,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed some data if empty
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, role, city, age, languages, interests, about, hourly_rate, verified, rating)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run("Aarav", "aarav@example.com", "friend", "Mumbai", 24, "Hindi, English", "Movies, Cricket", "Love exploring new cafes and talking about cinema.", 800, 1, 4.8);
  insertUser.run("Ishani", "ishani@example.com", "friend", "Delhi", 22, "Hindi, English, Punjabi", "Travel, Photography", "Avid traveler looking for companions for city tours.", 1000, 1, 4.9);
  insertUser.run("Rohan", "rohan@example.com", "friend", "Bangalore", 26, "Kannada, English", "Tech, Gaming", "Let's grab a coffee and talk about the latest tech trends.", 750, 1, 4.7);
  insertUser.run("Priya", "priya@example.com", "friend", "Pune", 23, "Marathi, Hindi, English", "Books, Art", "Quiet companion for library visits or art galleries.", 900, 1, 5.0);
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer });
  const PORT = 3000;

  app.use(express.json());

  // WebSocket logic
  const clients = new Map<number, WebSocket>();

  wss.on("connection", (ws) => {
    let userId: number | null = null;

    ws.on("message", (data) => {
      const message = JSON.parse(data.toString());

      if (message.type === "auth") {
        userId = message.userId;
        if (userId) clients.set(userId, ws);
      } else if (message.type === "chat") {
        const { senderId, receiverId, content } = message;
        
        // Save to DB
        db.prepare("INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)")
          .run(senderId, receiverId, content);

        // Send to receiver if online
        const receiverWs = clients.get(receiverId);
        if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
          receiverWs.send(JSON.stringify({
            type: "chat",
            senderId,
            content,
            createdAt: new Date().toISOString()
          }));
        }
      }
    });

    ws.on("close", () => {
      if (userId) clients.delete(userId);
    });
  });

  // API Routes
  app.get("/api/friends", (req, res) => {
    const friends = db.prepare("SELECT * FROM users WHERE role = 'friend'").all();
    res.json(friends);
  });

  app.get("/api/friends/:id", (req, res) => {
    const friend = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'friend'").get(req.params.id);
    if (friend) {
      res.json(friend);
    } else {
      res.status(404).json({ error: "Friend not found" });
    }
  });

  app.get("/api/messages/:userId/:otherId", (req, res) => {
    const { userId, otherId } = req.params;
    const messages = db.prepare(`
      SELECT * FROM messages 
      WHERE (sender_id = ? AND receiver_id = ?) 
      OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC
    `).all(userId, otherId, otherId, userId);
    res.json(messages);
  });

  app.post("/api/bookings", (req, res) => {
    const { customerId, friendId, activity, duration } = req.body;
    const info = db.prepare(`
      INSERT INTO bookings (customer_id, friend_id, activity, duration)
      VALUES (?, ?, ?, ?)
    `).run(customerId, friendId, activity, duration);
    res.json({ id: info.lastInsertRowid });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
