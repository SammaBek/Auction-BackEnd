const express = require("express");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const mealsRoutes = require("./routes/routes-meals");
const HttepError = require("./models/http-error");
const userRoutes = require("./routes/users-routes");
const app = express();
app.use(cookieParser());
app.use(bodyParser.json());
app.use("/uploads/images", express.static(path.join("uploads", "images")));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With,Content-Type,Accept,Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE");
  next();
});

app.use("/api/meals", mealsRoutes);
app.use("/api/users", userRoutes);

app.use((req, res, next) => {
  return next(new HttepError("Couldnt find the route", 404));
});

app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }
  if (res.headerSent) {
    return next(Error);
  }

  res.status(error.code || "500");

  if (error.message == "JsonWebTokenError: invalid signature") {
    res.json({ message: "Wrong Token you are not Authorized" });
  }

  if (error.message == "TokenExpiredError: jwt expired") {
    res.json({ message: "The token has expired" });
  } else {
    res.json({ message: error.message || "Unknown Error Happened" });
  }
});

mongoose
  .connect(
    "mongodb+srv://SammaBek2021:SammaBek2021@cluster0.ny4xp.mongodb.net/MealApp?retryWrites=true&w=majority"
  )
  .then(() => {
    app.listen(8000);
    console.log("DataBase Connected");
  })
  .catch((err) => console.log(err));
