const jwt = require("jsonwebtoken");
const HttepError = require("../models/http-error");
const bcrypt = require("bcrypt");
const User = require("../models/users");
const SendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const Email = require("../utils/sendEmail");

exports.protect = async (req, res, next) => {
  let token;
  // check if there is header and it the the token is there

  console.log("BodyBody", req.body);

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  console.log("here is Auth header", req.headers.authorization);

  if (!token) {
    return next(new HttepError("You are not Authorized", 401));
  }
  // Verify if token is correct
  let decoded;
  try {
    decoded = jwt.verify(token, "super_secret_key");
  } catch (err) {
    return next(new HttepError("Not Authorized"));
  }
  console.log(decoded.userId);
  let usr;
  try {
    usr = await User.findById(decoded.userId);
  } catch {
    return next("Couldnt find the User");
  }

  if (!usr) {
    return next(
      new HttepError(
        "The User which this token belongs to is no longer Available",
        401
      )
    );
  }

  if (usr.passwordChangedAfter(decoded.iat)) {
    return next(new HttepError("Password Changed After token issued"));
  }

  //   console.log(decoded);
  req.user = usr;
  next();
};

exports.restrictedTo = (...roles) => {
  return (req, res, next) => {
    console.log(req.user);
    // console.log(req.user.role);
    if (!roles.includes(req.user.role)) {
      return next(
        new HttepError("you are not Authorized for this action", 403)
      );
    }
    next();
  };
};

exports.forgotPassword = async (req, res, next) => {
  //1) Find the user with email
  let theUser;
  try {
    theUser = await User.findOne({ email: req.body.email });
  } catch {
    return next(new HttepError("Error while fetching the user", 400));
  }

  if (!theUser) {
    return next(new HttepError("The user doesnt Exist"));
  }

  //2) Generate random token
  let randomToken = theUser.passwordResetToken();
  await theUser.save({ validateBeforeSave: false }); //we save the document

  //3) send the generated token to the email address

  const ResetURL = `${req.protocol}://localhost:3000/newpassword/${randomToken}`;

  try {
    await new Email(theUser, ResetURL).SendPassForget();

    res
      .status(200)
      .json({ status: "Sucess", message: "Password Reset Token Sent" });
  } catch {
    theUser.PasswordResetToken = undefined;
    theUser.PasswordResetExpires = undefined;
    await theUser.save({ validateBeforeSave: false }); //we save the document

    return next(new HttepError("couldnt send the email", 500));
  }
};

exports.resetPassword = async (req, res, next) => {
  const hashToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  let theUser;
  try {
    theUser = await User.findOne({
      PasswordResetToken: hashToken,
      PasswordResetExpires: { $gt: Date.now() },
    });
  } catch {
    return next(new HttepError("couldnt find the User"));
  }

  if (!theUser) {
    return next(
      new HttepError("Either the token doesnt exist or it has expired", 400)
    );
  }
  // let hashedPassword;
  // try {
  //   hashedPassword = await bcrypt.hash(req.body.password, 12);
  // } catch {
  //   return next(new HttepError("Couldnt Create User(bcrypt)", 500));
  // }

  theUser.password = req.body.password;

  theUser.passwordResetExpires = undefined;
  theUser.PasswordResetToken = undefined;
  try {
    await theUser.save({ validateModifiedOnly: true });
  } catch (err) {
    return next(new HttepError(err.message, 400));
  }

  let token;
  try {
    token = jwt.sign({ userId: theUser._id }, "super_secret_key", {
      expiresIn: "1h",
    });
  } catch {}

  res.status(201).json({ token: token, user: theUser });
};

exports.updatePassword = async (req, res, next) => {
  console.log("REQ body", req.body);
  let theUser;

  theUser = await User.findById(req.user._id);

  console.log(theUser);

  isValid = await theUser.comparePassword(
    req.user.password,
    req.body.currentPass
  );
  if (!isValid) {
    return next(new HttepError("Your Current Password is Wrong", 401));
  }
  theUser.password = req.body.newPass;
  await theUser.save({ validateModifiedOnly: true });

  let token;

  token = jwt.sign({ userId: theUser.id }, "super_secret_key", {
    expiresIn: "1h",
  });

  res.status(200).json({ token: token, theUser });
};
