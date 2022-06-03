const HttepError = require("../models/http-error");
const Meals = require("../models/Meals");
const Bids = require("../models/Bids");
const Chats = require("../models/Chats");
const { validationResult } = require("express-validator");
const { newBid, newNotification } = require("../utils/socket");
const Notification = require("../models/Notifications");
const { match } = require("assert");

const getMealById = async (req, res, next) => {
  const id = req.params.id;
  let meal;
  try {
    meal = await Meals.findById(id).populate("bids");
  } catch {
    return next(new HttepError("Couldnt Find The Meal you searched", 500));
  }

  if (!meal) {
    return next(new HttepError("Meal you Searched Couldnt be found", 404));
  }

  res.json({ meal: meal.toObject({ getters: true }) });
};

const getMeal = async (req, res, next) => {
  let meal;
  try {
    meal = await Meals.find().populate("bids");
  } catch {
    return next(new HttepError("Couldnt Find ANY Meal ", 500));
  }

  if (meal.length === 0) {
    return next(new HttepError("NO MEALS FOUND", 404));
  }
  console.log(meal);
  res.json({ meal: meal.map((ml) => ml.toObject({ getters: true })) });
};

const getMealByUserId = async (req, res, next) => {
  const id = req.params.id;

  let meals, meal;

  try {
    meal = await Meals.findById(req.params.id).populate("bids");
  } catch {
    return next(new HttepError("Couldnt Find The meal with this User"));
  }

  if (!meal || meal.length === 0) {
    return next(new HttepError("User Id provided Couldnt be found", 404));
  }
  res.json(200);
  res.json({ meal: meal });
};

const getByName = async (req, res, next) => {
  const name = req.params.search;

  console.log("this is name of product", name);

  let meals, meal;

  try {
    meal = await Meals.find({ $text: { $search: name } }).populate("bids");
  } catch {
    return next(new HttepError("Couldnt Find The Product"));
  }

  if (!meal || meal.length === 0) {
    res.status(200);
    res.json({ meal: [] });
  } else {
    res.status(200);
    res.json({ meal: meal });
  }
};

const filterProduct = async (req, res, next) => {
  console.log(req.query);

  const obj = {};
  const objF = {};

  const k = Object.keys(req.query);

  k.map((key) => {
    if (
      key === "price" ||
      key === "specs.milage" ||
      key == "specs.engineSize"
    ) {
      obj[key] = JSON.parse(req.query[key]);
    } else {
      obj[key] = req.query[key];
    }
  });

  // const strQuery = JSON.stringify(req.query);

  // const strF = strQuery.replace(/\b(gte|lte)\b/g, (match) => `$${match}`);

  // const Query = JSON.parse(strF);
  // console.log(Query);

  console.log(obj);

  let products;

  try {
    products = await Meals.find(obj);
  } catch (err) {
    return next(
      new HttepError("Couldnt Find The product with this Filter Object")
    );
  }

  res.status(200).json({ products });
};

const getProduct = async (req, res, next) => {
  const id = req.params.id;

  let meals, meal;

  try {
    meal = await Meals.findById({ price: req.body.price })
      .explain()
      .populate("bids");
  } catch {
    return next(new HttepError("Couldnt Find The meal with this User"));
  }

  if (!meal || meal.length === 0) {
    return next(new HttepError("User Id provided Couldnt be found", 404));
  }
  res.json(200);
  res.json({ meal: meal });
};

const createMeal = async (req, res, next) => {
  const error = validationResult(req);

  if (!error.isEmpty()) {
    return next(new HttepError("Invalid inputs passed", 400));
  }
  console.log(req.user._id);
  const {
    price,
    name,
    description,

    productCatagory,
    status,

    ...specs
  } = req.body;
  console.log(req.body);
  const newMeal = new Meals({
    name,
    price,
    description,

    productCatagory,
    status,

    image: req.file.path,
    owner: req.user._id,
    createdAt: Date.now(),
    specs,
  });

  console.log(newMeal);

  try {
    await newMeal.save();
  } catch {
    return next(new HttepError("couldnt save the meal to Data Base", 500));
  }

  res.status(201);
  res.json({ places: newMeal });
};

const updateMeal = async (req, res, next) => {
  const { price, name } = req.body;
  let updatedMeal;
  try {
    updatedMeal = await Meals.findByIdAndUpdate(req.params.pid, req.body, {
      new: true,
    });

    res.status(200).json({ places: updatedMeal.toObject({ getters: true }) });
  } catch {
    return next(new HttepError("couldnt update", 500));
  }
};

const deleteMeal = async (req, res, next) => {
  let newMeal;
  try {
    const mm = await Meals.findByIdAndDelete(req.params.pid);
    if (!mm) {
      return next(new HttepError("No meal exist with this Id", 500));
    }
    res.status(201).json({ Message: "Deleted" });
  } catch {
    return next(new HttepError("couldnt delete", 500));
  }
};

const bid = async (req, res, next) => {
  const { name, email, price, product, prodImage, ownerId } = req.body;
  console.log(req);
  let Bid, Notf;
  console.log(name, email, price, product, prodImage);
  Bid = new Bids({
    name,
    email,
    price,
    product,
    image: prodImage,
    bidderId: req.user.id,
  });

  try {
    await Bid.save();
  } catch {
    return next(new HttepError("Couldnt save the bid", 500));
  }
  newBid(Bid, ownerId);

  Notf = new Notification({
    sender: req.user.id,
    receiver: ownerId,
    product: product,
    message: `${req.user.userName} has made a bid on your product`,
    to: "bids",
  });

  console.log(Notf);

  try {
    await Notf.save();
  } catch (err) {
    return next(new HttepError("Couldnt save notification", 500));
  }
  newNotification(Notf, ownerId);

  res.status(200).json({ Bid });
};

const getNotification = async (req, res, next) => {
  const id = req.params.id;
  let notifications;
  try {
    notifications = await Notification.find({ receiver: id });
  } catch (err) {
    return next(new HttepError("Couldnt find notifications", 500));
  }

  res.status(200).json({ notifications });
};

exports.getMealById = getMealById;
exports.getMealByUserId = getMealByUserId;
exports.createMeal = createMeal;
exports.updateMeal = updateMeal;
exports.deleteMeal = deleteMeal;
exports.getMeal = getMeal;
exports.makeBid = bid;
exports.getNotf = getNotification;
exports.getProduct = getProduct;
exports.getProductByName = getByName;
exports.filterProduct = filterProduct;
