const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { Double } = require("mongodb");

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    userName: { type: String, required: true, unique: true },
    email: {
      type: String,
      required: true,
      unique: [true, "Email Field has to be Unique"],
    },
    password: { type: String, required: true, minlength: 6 },
    passwordChangedAt: Date,
    image: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    PasswordResetToken: String,
    passwordResetExpires: Date,
    createdAt: { type: Date },
    phone: { type: Number },
    address: { type: String },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
userSchema.virtual("products", {
  ref: "Meals",
  foreignField: "owner",
  localField: "_id",
});

userSchema.methods.passwordChangedAfter = function (JWTTimesStamp) {
  if (this.passwordChangedAt) {
    const changedAt = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    console.log(changedAt, JWTTimesStamp);
    return JWTTimesStamp < changedAt;
  }

  return false;
};

userSchema.methods.passwordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.PasswordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  console.log({ resetToken }, this.PasswordResetToken);

  return resetToken;
};

userSchema.methods.comparePassword = async function (passDB, plainPass) {
  return await bcrypt.compare(plainPass, passDB);
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  console.log("preSave", this.password);

  this.password = await bcrypt.hash(this.password, 12);
  console.log("after", this.password);
  next();
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  console.log("preSave ");

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, async function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.plugin(uniqueValidator);
module.exports = mongoose.model("User", userSchema);
