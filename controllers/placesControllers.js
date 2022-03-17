const HttepError = require("../models/http-error");
const Meals = require("../models/Meals");
const Bids = require("../models/Bids");
const { validationResult } = require("express-validator");

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
    productType,
    productCatagory,
    productDeadline,
  } = req.body;
  console.log(req.body);
  const newMeal = new Meals({
    name,
    price,
    description,
    productType,
    productCatagory,
    productDeadline: new Date(productDeadline),
    image: req.file.path,
    owner: req.user._id,
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
  const { name, email, price, product, prodImage } = req.body;
  console.log(req);
  let Bid;
  console.log(name, email, price, product, prodImage);
  Bid = new Bids({ name, email, price, product, image: prodImage });

  try {
    await Bid.save();
  } catch {
    return next(new HttepError("Couldnt save the bid", 500));
  }

  res.status(200).json({ bid });
};

const getBid = async (req, res, next) => {};

exports.getMealById = getMealById;
exports.getMealByUserId = getMealByUserId;
exports.createMeal = createMeal;
exports.updateMeal = updateMeal;
exports.deleteMeal = deleteMeal;
exports.getMeal = getMeal;
exports.makeBid = bid;
exports.getBid = getBid;
