const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const chatSchema = new Schema({
  message: { type: String, required: [true, "Message is required"] },
  sender: {
    type: String,
    required: [true, "sender is required"],
  },
  users: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "users is a must"],
    },
  ],
  participants: [{ type: String }],
  createdAt: { type: Date, required: [true, "TimeStamp is required"] },
  seen: { type: Boolean, default: false },
  image: { type: String },
});

chatSchema.pre("/^find/", function (next) {
  this.populate({ path: "users", select: "userName" });
  next();
});

module.exports = mongoose.model("Chat", chatSchema);
