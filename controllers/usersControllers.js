const bcrypt = require("bcrypt");
const HttepError = require("../models/http-error");
const jwt = require("jsonwebtoken");
const express = require("express");
const { savedToDB, sendMsg, newNotification } = require("../utils/socket");
const { validationResult } = require("express-validator");
const User = require("../models/users");
const { findById } = require("../models/users");
const Email = require("../utils/sendEmail");
const Chats = require("../models/Chats");
const aws = require("aws-sdk");
const fs = require("fs");

const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
  "image/webp": "webp",
};

aws.config.setPromisesDependency();
aws.config.update({
  accessKeyId: "AKIART7JBNOJTAF6PZBN",
  secretAccessKey: "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",
  region: "us-east-1",
});
const s3 = new aws.S3();
// const s3 = new aws({
//   credentials: {
//     accessKeyId: "AKIART7JBNOJTAF6PZBN",
//     secretAccessKey: "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",
//   },
//   region: "US East (N. Virginia) us-east-1",
// });

const createUser = async (req, res, next) => {
  const { userName, password, email, passwordChangedAt, role, phone, address } =
    req.body;
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
    phone,
    role,
    address,
    image: req.file.filename,
    createdAt: Date.now(),
  });

  let token;
  try {
    token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      "super_secret_key",
      { expiresIn: "1h" }
    );
  } catch {}
  const url = `${req.protocol}://${req.get("host")}`;
  await new Email(newUser, url).sendWelcome();

  newUser.password = undefined;

  console.log(`Req FILE: ${req.file.filename}`);

  const ext = MIME_TYPE_MAP[req.file.mimetype];

  const uploadParams = {
    Bucket: "gabaa-app-resource",
    Key: req.file.filename,
    Body: fs.createReadStream(req.file.path),
    ACL: "public-read",
  };

  // const command = new putObjectCommand(uploadParams);
  // const result = await s3.send(command).promise();
  // console.log(result);

  s3.upload(uploadParams, (err, data) => {
    if (err) {
      console.log(`error while uploading:${err}`);
      if (data) {
        console.log(`this is data from s3: ${data}`);
      }
    }
  });

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

  savedToDB("New log in");

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
  const filter = ["userName", "phone", "address"];
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

const sendMessage = async (req, res, next) => {
  const { users, message, sender, image } = req.body;
  const Chat = new Chats({
    users,
    message,
    sender,
    createdAt: Date.now(),
    image,
    participants: users,
  });

  try {
    await Chat.save();
  } catch (err) {
    return next(new HttepError("Couldnt save the message", 500));
  }
  sendMsg(Chat);
  newNotification(Chat);
  res.status(201).json({ Chat: Chat.toJSON({ getters: true }) });
};

const getMessage = async (req, res, next) => {
  console.log("this is body", req.body);
  const { user1, user2 } = req.body;
  let chat;
  try {
    chat = await Chats.find({ participants: { $all: [user1, user2] } })
      .populate({ path: "users", select: "userName" })
      .populate({ path: "sender", select: "image" })
      .sort({ createdAt: -1 })
      .limit(20);
  } catch (err) {
    return next(new HttepError("Couldnt find the chat", 500));
  }

  if (chat.length > 0) {
    console.log(JSON.stringify(chat[0]._id));
    let id = JSON.stringify(chat[0]._id);

    id = id.slice(1, id.length - 1);

    console.log(`this is the message id ${id}`);

    let ch;

    if (chat[0].seen === false) {
      console.log("in the if close");
      try {
        await Chats.findByIdAndUpdate(id, { seen: true });
      } catch (err) {
        return next(new HttepError("Couldnt carry on Operation", 500));
      }
    }
  }

  res.status(200).json({ chat });
};

const getChats = async (req, res, next) => {
  let chats;
  let myUser = req.body.myUser;
  console.log("this is ID", myUser);
  try {
    chats = await Chats.aggregate([
      {
        $match: {
          participants: {
            $in: [myUser],
          },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$participants",
          message: { $first: "$message" },
          createdAt: { $first: "$createdAt" },
          image: { $first: "$image" },
          participants: { $first: "$participants" },
          sender: { $first: "$sender" },
          seen: { $first: "$seen" },
        },
      },
      { $sort: { createdAt: 1 } },
    ]);
  } catch (err) {
    return next(new HttepError("Couldnt find the chat", 500));
  }

  console.log(chats);
  let arr = [];
  let val, Usr;

  for (let i = 0; i < chats.length; i++) {
    let arrUnique = [];
    for (let j = i + 1; j < chats.length; j++) {
      let c = 0;
      for (let k = 0; k < 2; k++) {
        for (let l = 0; l < 2; l++) {
          if (chats[i].participants[k] === chats[j].participants[l]) {
            // console.log(`${chats[i]._id[k]} and  ${chats[j]._id[l]}`);
            c++;
          }
        }
      }
      arrUnique.push(c);
    }
    let obj;
    if (!arrUnique.includes(2)) {
      for (let m = 0; m < 2; m++) {
        if (chats[i].participants[m] !== myUser) {
          console.log(` participant ${chats[i].participants[m]}`);
          Usr = await User.findById(chats[i].participants[m]);
          if (Usr) {
            obj = {
              message: chats[i].message,
              _id: chats[i].message,
              image: Usr.image,
              participants: chats[i].participants,
              sender: chats[i].sender,
              name: Usr.userName,
              seen: chats[i].seen,
            };
          }

          console.log(obj);
        }
      }

      arr.push(obj);
    }
  }

  arr.reverse();
  let count = 0;
  console.log(req.body.number);
  console.log(arr);
  if (req.body.number === 0) {
    console.log(arr[0]);
    arr.map((ch) => {
      if (ch) {
        if (ch.seen === false) {
          console.log("Count");
          count++;
        }
      }
    });
    res.status(200).json({ num: count });
  } else {
    res.status(200).json({ arr });
  }
};

exports.createUser = createUser;
exports.loginUser = loginUser;
exports.deleteUser = deleteUser;
exports.getUser = getUser;
exports.updateData = updateData;
exports.deleteMe = deleteMe;
exports.sendMessage = sendMessage;
exports.getMessage = getMessage;
exports.getChats = getChats;
