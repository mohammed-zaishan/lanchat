const express = require("express");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const multer = require("multer");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" },
});

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const safeName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, safeName);
  },
});
const upload = multer({ storage });

app.post("/upload", upload.single("file"), (req, res) => {
  const fileUrl = `/uploads/${req.file.filename}`;
  console.log(`File uploaded: ${fileUrl}`);
  res.json({ fileUrl, originalName: req.file.originalname });
});

app.get("/download/:filename", (req, res) => {
  const file = path.join(__dirname, "uploads", req.params.filename);
  if (fs.existsSync(file)) res.download(file);
  else res.status(404).send("File not found");
});


const users = new Map();

const groups = new Map();

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  const defaultUser = {
    id: socket.id,
    name: "Guest " + socket.id.slice(0, 4),
    deviceName: socket.handshake.address || "Unknown device",
  };
  users.set(socket.id, defaultUser);
  io.emit("users:update", Array.from(users.values()));

  socket.on("register", ({ name, deviceName }) => {
    const user = {
      id: socket.id,
      name: name || defaultUser.name,
      deviceName: deviceName || defaultUser.deviceName,
    };
    users.set(socket.id, user);
    console.log(
      `Registered: ${socket.id} → ${user.name} (${user.deviceName})`
    );
    io.emit("users:update", Array.from(users.values()));
  });

  socket.on("chat message", (text) => {
    const from = users.get(socket.id) || defaultUser;
    io.emit("chat message", {
      from,
      text,
      timestamp: Date.now(),
    });
  });

  socket.on("private message", ({ to, text }) => {
    const from = users.get(socket.id);
    if (!from) return;

    const payload = {
      from,
      to,
      text,
      timestamp: Date.now(),
    };

    socket.to(to).emit("private message", payload);
    socket.emit("private message", payload);
  });

  socket.on("file message", ({ fileUrl, fileName, to = null }) => {
    const from = users.get(socket.id) || defaultUser;

    if (to) {
      const payload = { from, fileUrl, fileName, private: true, to };
      socket.to(to).emit("file message", payload);
      socket.emit("file message", payload);
    } else {
      io.emit("file message", {
        from,
        fileUrl,
        fileName,
        private: false,
        timestamp: Date.now(),
      });
    }
  });

  socket.on("group join", ({ groupId, name }) => {
    if (!groups.has(groupId)) {
      groups.set(groupId, { id: groupId, name: name || groupId, members: [] });
    }
    const group = groups.get(groupId);

    if (!group.members.includes(socket.id)) {
      group.members.push(socket.id);
    }

    socket.join(groupId);
    console.log(`${socket.id} joined group ${groupId}`);

    io.to(groupId).emit("group:update", group);
  });

  socket.on("group message", ({ groupId, text }) => {
    const from = users.get(socket.id);
    if (!from) return;

    io.to(groupId).emit("group message", {
      from,
      groupId,
      text,
      timestamp: Date.now(),
    });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    users.delete(socket.id);

    for (const [id, group] of groups) {
      group.members = group.members.filter((m) => m !== socket.id);
      io.to(id).emit("group:update", group);
    }

    io.emit("users:update", Array.from(users.values()));
  });
});

const bonjour = require('bonjour')();
const PORT = 80; // change to other ports

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running`);

  bonjour.publish({
    name: 'LAN Chat',
    type: 'http',
    port: PORT,
    host: 'lanchat.local'
  });
});
