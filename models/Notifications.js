const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const NotificationSchema = new Schema(
  {
    sender: {
      type: mongoose.Schema.ObjectId,
      required: [true, "A notification must have sender"],
      ref: "User",
    },
    receiver: {
      type: String,
      required: [true, "a notification must have receiver"],
    },
    product: { type: String },
    message: {
      type: String,
      required: [true, "A notification must have message"],
    },
    to: { type: String, enum: ["bids", "products"] },
    createdAt: { type: Date, default: Date.now() },
    read: { type: Boolean, default: false },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

NotificationSchema.pre(/^find/, function (next) {
  this.populate({ path: "sender", select: "userName" });
  next();
});

module.exports = mongoose.model("Notification", NotificationSchema);
