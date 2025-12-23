const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());


app.get("/", (req, res) => {
  res.send("WebSocket Server is running");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const boards = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-board", (boardId) => {
    socket.join(boardId);

    if (!boards[boardId]) {
      boards[boardId] = [];
    }

  
    socket.emit("load-board", boards[boardId]);
  });

  socket.on("draw", ({ boardId, stroke }) => {
    if (!boards[boardId]) boards[boardId] = [];
    boards[boardId].push(stroke);

    
    socket.to(boardId).emit("draw", stroke);
  });

  socket.on("clear-board", (boardId) => {
    boards[boardId] = [];
    io.to(boardId).emit("clear-board");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
