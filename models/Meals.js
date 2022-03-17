const HttepError = require("../models/http-error");
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const MealSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: [true, "Name of product has to be unique"],
    },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    productType: {
      type: String,
      enum: ["Used", "New", "Slightly Used"],
      require: [true, "Product Type is required"],
    },
    productCatagory: { type: String, enum: ["HomeAppliance", "Cars", "Other"] },
    productDeadline: { type: Date, required: [true, "Deadline has to be set"] },
    image: String,
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "A product must have owner"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

MealSchema.virtual("bids", {
  ref: "Bids",
  foreignField: "product",
  localField: "_id",
});

MealSchema.pre(/^find/, function (next) {
  this.populate({ path: "owner", select: "userName" });
  next();
});

module.exports = mongoose.model("Meals", MealSchema);
