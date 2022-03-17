const bcrypt = require("bcrypt");
const HttepError = require("../models/http-error");
const jwt = require("jsonwebtoken");

const { validationResult } = require("express-validator");
const User = require("../models/users");
const { findById } = require("../models/users");

const createUser = async (req, res, next) => {
  const { userName, password, email, passwordChangedAt, role } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch {
    return next(new HttepError("Error occurred", 400));
  }

  if (existingUser) {
    return next(new HttepError("User already exists, please Login", 400));
  }

  const error = validationResult(req);

  if (!error.isEmpty()) {
    return next(new HttepError("Invalid inputs passed", 400));
  }

  const newUser = await User.create({
    userName,
    password,
    email,
    role,
    image: req.file.path,
  });

  let token;
  try {
    token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      "super_secret_key",
      { expiresIn: "1h" }
    );
  } catch {}
  newUser.password = undefined;

  res.status(201).json({ token: token, theUser: newUser });
};

const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  console.log(req);

  let theUser;
  try {
    theUser = await User.findOne({ email: email });
  } catch {
    return next(new HttepError("Couldnt log you in", 400));
  }

  if (!theUser) {
    return next(new HttepError("Couldnt find the User, please log in", 400));
  }

  let isValidPassword, token;

  console.log(theUser.password);

  try {
    isValidPassword = await bcrypt.compare(password, theUser.password);
  } catch {
    return next(new HttepError("Couldnt log you in", 500));
  }

  if (!isValidPassword) {
    return next(new HttepError("Wrong Credentials", 400));
  }
  try {
    token = jwt.sign(
      { userId: theUser.id, email: theUser.email },
      "super_secret_key",
      { expiresIn: "1h" }
    );
  } catch {
    return next(new HttepError("Couldnt issue a token", 400));
  }

  res.cookie("jwt", token, {
    expires: new Date(Date.now() + 60 * 60 * 1000),
    httpOnly: true,
    secure: true,
  });
  theUser.password = undefined;
  res.status(200).json({
    token: token,

    theUser,
  });
};

const deleteUser = async (req, res, next) => {
  let userLeft;
  let delUser;
  try {
    delUser = await User.findById(req.params.pid);
  } catch {
    return next(new HttepError("couldnt Delete", 400));
  }

  if (!delUser) {
    return next(new HttepError("couldnt find the user to be deleted", 400));
  }

  try {
    await User.findByIdAndDelete(req.params.pid, { new: true });
  } catch {
    return next(new HttepError("couldnt Delete", 400));
  }

  res.status(200).json({ user: delUser.toObject({ getters: true }) });
};

const getUser = async (req, res, next) => {
  let users;

  console.log("Here is Params", req.params.pid);
  try {
    users = await User.findById(req.params.pid, "-password").populate({
      path: "products",
      model: "Meals",
      populate: {
        path: "bids",
        model: "Bids",
      },
    });
  } catch {
    return next(new HttepError("Fetching Failed", 400));
  }
  if (users.length === 0) {
    return next(new HttepError("No User exists", 400));
  }

  res.status(200).json({ user: users.toObject({ getters: true }) });
};

const updateData = async (req, res, next) => {
  if (req.body.password) {
    return next(new HttepError("You cant update your password here", 400));
  }

  let theUser, token;
  const Data = req.body;
  console.log("this", Data);
  const filter = ["email", "userName"];
  const newObj = {};
  theUser = await User.findById(req.user.id);

  Object.keys(Data).map((key) => {
    if (filter.includes(key)) {
      theUser[key] = Data[key];
    }
  });

  console.log("obj", newObj);
  console.log("this ID", req.user.id);

  // theUser = await User.findOneAndUpdate({ id: req.user.id }, newObj, {
  //   runValidators: true,
  //   new: true,
  //   context: "query",
  // });

  try {
    token = jwt.sign(
      { userId: theUser.id, email: theUser.email },
      "super_secret_key",
      { expiresIn: "1h" }
    );
  } catch {
    return next(new HttepError("Couldnt issue a token", 400));
  }

  await theUser.save({ validateModifiedOnly: true });

  console.log(theUser);
  res.status(200).json({
    message: "Updated",
    token: token,
    Data: theUser.toObject({ getters: true }),
  });
};

const deleteMe = async (req, res, next) => {
  let theUser;
  try {
    await User.findByIdAndUpdate(req.user._id, { active: false });
  } catch {
    return next(new HttepError("couldnt Update"));
  }

  res.status(204).json({ message: "Deleted" });
};

exports.createUser = createUser;
exports.loginUser = loginUser;
exports.deleteUser = deleteUser;
exports.getUser = getUser;
exports.updateData = updateData;
exports.deleteMe = deleteMe;
