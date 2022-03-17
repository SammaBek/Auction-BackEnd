const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const BidSchema = new Schema(
  {
    name: { type: String, required: [true, "A bidder has to have name"] },
    price: { type: Number, required: [true, "A bid has to have a price"] },
    email: { type: String, required: [true, "A bidder has to have an email"] },
    product: {
      type: mongoose.Schema.ObjectId,
      required: [true, "A bid has to have a product"],
      ref: "Meals",
    },
    // image: {
    //   type: mongoose.Schema.ObjectId,
    //   required: [true, "A bidder has to have a picture"],
    //   ref: "User",
    // },

    image: { type: String, required: [true, "A bidder has to have a pic"] },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

BidSchema.pre("/^find/", function (next) {
  this.populate({ path: "product", select: "name" }).populate({
    path: "image",
    select: "image",
  });
  next();
});

module.exports = mongoose.model("Bids", BidSchema);
