const express = require("express");
const HttepError = require("../models/http-error");
const mealControllers = require("../controllers/placesControllers");
const Auth = require("../auth/AuthController");
const { check } = require("express-validator");
const multer = require("multer");
const upload = require("../utils/fileUpload");

const router = express.Router();

router.get("/", mealControllers.getMeal);
router.get(
  "/getByName/:search",

  mealControllers.getProductByName
);

router.get("/filterProducts/", mealControllers.filterProduct);
router.get("/:id", mealControllers.getMealById);

router.get("/myproducts/:id", mealControllers.getMealByUserId);
router.post("/makebid", Auth.protect, mealControllers.makeBid);

router.get("/getnotification/:id", Auth.protect, mealControllers.getNotf);

router.post(
  "/addproduct",
  Auth.protect,
  upload.array("images"),
  check("name").not().isEmpty(),
  mealControllers.createMeal
);

router.patch("/:pid", mealControllers.updateMeal);
router.delete("/:pid", mealControllers.deleteMeal);

module.exports = router;
