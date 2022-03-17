const nodemailer = require("nodemailer");

const SendEmail = async (options) => {
  //1) Create Transporter
  const transporter = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "203d9133675237",
      pass: "f10b2db0c720c0",
    },
  });

  //2) define options for email

  const mailOptions = {
    from: "Samuel Bekele <sammabek@test.com>",
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  //3) send the Email
  transporter.sendMail(mailOptions);
};
module.exports = SendEmail;
