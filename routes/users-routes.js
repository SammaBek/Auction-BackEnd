const express = require("express");
const userControllers = require("../controllers/usersControllers");
const Auth = require("../auth/AuthController");
const { check } = require("express-validator");
const fileUpload = require("../utils/fileUpload");
const productController = require("../controllers/placesControllers");

const router = express.Router();

router.get("/:pid", Auth.protect, userControllers.getUser);

router.post(
  "/signup",
  fileUpload.single("image"),
  check("email").not().isEmpty(),
  check("password").isLength({ min: 5, max: 10 }),
  userControllers.createUser
);

router.post("/login", userControllers.loginUser);
router.post("/getChats", userControllers.getChats);
router.post("/getChat", Auth.protect, userControllers.getMessage);
router.patch("/forgotPassword", Auth.forgotPassword);
router.patch("/resetPassword/:token", Auth.resetPassword);
router.patch("/updatePassword", Auth.protect, Auth.updatePassword);
router.patch("/updateData", Auth.protect, userControllers.updateData);
router.post("/sendMessage", Auth.protect, userControllers.sendMessage);
router.delete("/deleteMe", Auth.protect, userControllers.deleteMe);
router.delete(
  "/:pid",
  Auth.protect,
  Auth.restrictedTo("admin"),
  userControllers.deleteUser
);

module.exports = router;
