const multer = require("multer");
const multerS3 = require("multer-s3");
const { v4: uuid } = require("uuid");
const HttepError = require("../models/http-error");
const aws = require("aws-sdk");
const fs = require("fs");
const sharp = require("sharp");

// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });

// console.log("multer is active");

const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
  "image/webp": "webp",
};

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// const upload = multer({
//   limits: 500000,
//   storage: multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, "uploads/images");
//       // console.log("Multer");
//       // console.log(file);
//     },
//     filename: async (req, file, cb) => {
//       const ext = MIME_TYPE_MAP[file.mimetype];
//       // console.log(` this is from multer${file}`);
//       console.log("Multer1");
//       console.log(file);

//       cb(null, uuid() + "." + ext);
//     },
//   }),
//   fileFilter: async (req, file, cb) => {
//     const isValid = !!MIME_TYPE_MAP[file.mimetype];
//     const error = isValid ? null : new HttepError("Invalid Mime type", 400);
//     console.log("Multer2");
//     console.log(file);

//     // console.log(`this is Also from Multer: ${file}`);
//     // const uploadParams = {
//     //   Bucket: "gabaa-app-resource",
//     //   Body: file.buffer,
//     //   Key: file.filename,
//     // };

//     // const result = await s3.upload(uploadParams).promise();
//     // console.log(result);

//     cb(error, isValid);
//   },
// });

module.exports = upload;
