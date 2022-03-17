const express = require("express");
const HttepError = require("../models/http-error");
const mealControllers = require("../controllers/placesControllers");
const Auth = require("../auth/AuthController");
const { check } = require("express-validator");
const fileUpload = require("../utils/fileUpload");

const router = express.Router();

router.get("/", Auth.protect, mealControllers.getMeal);

router.get("/:id", Auth.protect, mealControllers.getMealById);

router.get("/user/:id", mealControllers.getMealByUserId);
router.post("/makebid", Auth.protect, mealControllers.makeBid);
router.get("/getBid", Auth.protect, mealControllers.getBid);

router.post(
  "/addproduct",
  Auth.protect,
  fileUpload.single("image"),
  check("name").not().isEmpty(),
  mealControllers.createMeal
);

router.patch("/:pid", mealControllers.updateMeal);
router.delete("/:pid", mealControllers.deleteMeal);

module.exports = router;
