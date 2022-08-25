const nodemailer = require("nodemailer");
const pug = require("pug");
const HtmlToText = require("html-to-text");

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.userName.split(" ")[0];
    this.url = url;
    this.from = `Samuel Bekele <${process.env.EMAIL_FROM}>`;
  }
  newTransport() {
    if (process.env.NODE_ENV === "production") {
      console.log("we are in production");
      console.log(process.env);
      return nodemailer.createTransport({
        service: "SendGrid",
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    const html = pug.renderFile(`view/${template}.pug`, {
      firstName: this.firstName,
      subject,
      url: this.url,
    });

    const mailOptions = {
      from: `Samuel Bekele <${process.env.EMAIL_FROM}>`,
      to: this.to,
      subject,
      html,
      text: HtmlToText.fromString(html),
    };

    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send("welcomeEMail", "Welcome to Gabaa Auction");
  }

  async SendPassForget() {
    await this.send("forgetPassEmail", "Change Your Password");
  }
};
