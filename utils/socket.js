const productController = require("../controllers/placesControllers");
let io = null;
let soc = null;
let clients = {};
module.exports = {
  start: function (io) {
    io = io;
    io.on("connection", function (socket) {
      console.log(`this user:${socket.id}`);
      socket.on("register", (userId) => {
        if (userId) {
          console.log("someone connected");
          clients[userId] = socket;
        }
      });
      // socket.on("newMessage", (data) => {
      //   data.users.map((p) => {
      //     if (data.sender !== p) {
      //       console.log("message sent");
      //       console.log("reveiver", p);
      //       const Chat = productController.sendMessage(data);

      //       if (clients[p]) {
      //         clients[p].emit("messageFromServer", Chat);
      //       }
      //     }
      //   });

      //   console.log(data);
      // });

      socket.on("disconnect", () => {
        console.log(`this user disconnected: ${socket.id}`);
        const uId = Object.keys(clients).find((key) => clients[key] === socket);
        delete clients[uId];
      });
    });
  },
  savedToDB: function (message, receiver) {
    if (clients[receiver]) {
      clients[receiver].emit("savedToDB", { message: message });
    }
  },
  newBid: function (data, receiver) {
    if (clients[receiver]) {
      console.log(data);
      clients[receiver].emit("newBid", data);
    }
  },

  newNotification: function (data, receiver) {
    console.log(receiver);
    if (clients[receiver]) {
      clients[receiver].emit("newNotification", data);
    }
  },
  sendMsg: function (chat) {
    console.log(chat);
    chat.participants.map((p) => {
      if (chat.sender !== p) {
        console.log("message sent");
        console.log("reveiver", p);
        if (clients[p]) {
          clients[p].emit("messageFromServer", chat);
        }
      }
    });
  },
};
