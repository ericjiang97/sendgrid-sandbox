require("dotenv").config();
const express = require("express"),
  bodyParser = require("body-parser"),
  fetch64 = require("fetch-base64");

const sendgridClient = require("./config/sendgrid"),
  { STATUS } = require("./constants");

const PORT = process.env.PORT || 3000;

const app = express();
app.use(bodyParser.json());

app.post("/api/email", async (request, response, next) => {
  const {
    headerImgUrl,
    user,
    department,
    subject,
    body,
    signature,
    templateId
  } = request.body;
  const { email, first_name, last_name } = user;

  const attachments = [];
  if (headerImgUrl) {
    const headerImage = await fetch64.remote(headerImgUrl);
    attachments.push({
      filename: "header.png",
      type: "image/png",
      content: headerImage[0],
      content_id: "header_img",
      disposition: "inline"
    });
  }
  sendgridClient
    .send({
      to: email,
      from: process.env.SENDGRID_NOREPLY_EMAIL,
      templateId: templateId || process.env.SENDGRID_DEFAULT_TEMPLATE_ID,
      dynamic_template_data: {
        first_name,
        last_name,
        subject,
        body,
        signature,
        department
      },
      attachments
    })
    .then(resp => {
      response.json({ message: resp, status: STATUS.OK });
    })
    .catch(err => {
      response.status(500).send({ status: STATUS.ERROR, message: err });
    });
});

app.listen(PORT, () => {
  console.log(`App Listening on port ${PORT}`);
});
