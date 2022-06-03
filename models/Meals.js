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

    productCatagory: {
      type: String,
      enum: [
        "Home-Appliance",
        "Vehicles",
        "Electronics",
        "Clothing",
        "Home-Furniture",
        "Gym-Equipment",
      ],
    },
    createdAt: { type: Date },
    image: String,
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "A product must have owner"],
    },
    status: { type: String, enum: ["New", "Used"] },
    specs: {
      fuel: { type: String },
      specType: { type: String },
      transmission: { type: String },
      milage: { type: Number },
      make: { type: String },
      engineSize: { type: Number, default: 1000 },
      Gender: { type: String },
      phoneStorage: { type: Number },
      phoneRam: { type: Number },
      phoneBrand: { type: String },
      phoneModel: { type: String },
      phoneCamera: { type: Number },
      tvScreenSize: { type: String },
      tvResolution: { type: String },
      tvBrand: { type: String },
      tvModel: { type: String },
      ElectronicType: { type: String },
      laptopModel: { type: String },
      laptopStorage: { type: String },
      laptopRam: { type: Number },
      laptopScreenSize: { type: String },
      laptopProcessor: { type: String },
      laptopBrand: { type: String },
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
MealSchema.index({ name: "text", description: "text" });
MealSchema.index({ price: -1 });
MealSchema.index({ productCatagory: -1 });

MealSchema.virtual("bids", {
  ref: "Bids",
  foreignField: "product",
  localField: "_id",
});

MealSchema.pre(/^find/, function (next) {
  this.populate({ path: "owner", select: "userName _id" });
  next();
});

module.exports = mongoose.model("Meals", MealSchema);
