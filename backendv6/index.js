require("dotenv").config();
const http = require("http");
const cors = require("cors");
const express = require("express");
const conecttomongo = require("./db");
const utils = require("./utils/utils");
const admin = require("firebase-admin");
var bodyParser = require("body-parser");
const Friend = require("./models/friends");
const authRoutes = require("./routes/auth");
const msgRoutes = require("./routes/message");
const tokenRoutes = require("./routes/token");
const friendsRoutes = require("./routes/friend");
var serviceAccount = require("./utils/serviceAccountKey.json");
const { addMessage } = require("./controller/messageController");

const port = 80;
const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use("/uploads", express.static("./uploads"));
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

conecttomongo();

utils.mkdir("./uploads");

app.use("/api/auth", authRoutes);
app.use("/api/auth", msgRoutes);
app.use("/api/token", tokenRoutes);
app.use("/api/friends", friendsRoutes);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: `http://54.199.89.145:${port}`,
  },
});

global.onlineUsers = new Map();
io.on("connection", (socket) => {
  global.chatSocket = socket;
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("send-msg", async (data) => {
    let x = await Friend.findOne({
      uid: { $eq: data.from },
      friendId: { $eq: data.to },
    });
    if (!x) {
      x = await Friend.findOne({
        uid: { $eq: data.to },
        friendId: { $eq: data.from },
      });
    }
    if (x && x.both) {
      const { error, response } = await addMessage(data);
      if (response) {
        const token = await utils.getTokenByUserId(data.to);
        if (token) {
          await utils.sendFcmMessage("New Message", data.message, [token]);
        }
        const sendUserSocket = onlineUsers.get(data.to);
        if (sendUserSocket) {
          socket.to(sendUserSocket).emit("msg-recieve", data);
        }
      }
    }
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});
