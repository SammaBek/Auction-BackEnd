const express = require("express");
const HttepError = require("../models/http-error");
const mealControllers = require("../controllers/placesControllers");
const Auth = require("../auth/AuthController");
const { check } = require("express-validator");
const uploadS3 = require("../utils/fileUpload");

const router = express.Router();

router.get("/", mealControllers.getMeal);
router.get(
  "/getByName/:search",
  Auth.protect,
  mealControllers.getProductByName
);

router.get("/filterProducts/", mealControllers.filterProduct);
router.get("/:id", Auth.protect, mealControllers.getMealById);

router.get("/myproducts/:id", mealControllers.getMealByUserId);
router.post("/makebid", Auth.protect, mealControllers.makeBid);

router.get("/getnotification/:id", Auth.protect, mealControllers.getNotf);

router.post(
  "/addproduct",
  Auth.protect,
  uploadS3.single("image"),
  check("name").not().isEmpty(),
  mealControllers.createMeal
);

router.patch("/:pid", mealControllers.updateMeal);
router.delete("/:pid", mealControllers.deleteMeal);

module.exports = router;
