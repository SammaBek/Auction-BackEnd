const multer = require("multer");
const multerS3 = require("multer-s3");
const { v4: uuid } = require("uuid");
const HttepError = require("../models/http-error");
const aws = require("aws-sdk");

const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
  "image/webp": "webp",
};

const s3 = new aws.S3({
  accessKeyId: "AKIART7JBNOJTAF6PZBN",
  secretAccessKey: "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",
});
// const fileUpload = multer({
//   limits: 500000,
//   storage: multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, "uploads/images");
//     },
//     filename: (req, file, cb) => {
//       const ext = MIME_TYPE_MAP[file.mimetype];
//       console.log(file);
//       cb(null, uuid() + "." + ext);
//     },
//   }),
//   fileFilter: (req, file, cb) => {
//     const isValid = !!MIME_TYPE_MAP[file.mimetype];
//     const error = isValid ? null : new HttepError("Invalid Mime type", 400);
//     cb(error, isValid);
//   },
// });

const uploadS3 = multer({
  storage: multerS3({
    s3: s3,
    bucket: "gabaa-app-resource",
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString());
    },
  }),
});

// module.exports = fileUpload;
module.exports = uploadS3;
