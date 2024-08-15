const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/users");
const { upload } = require("../multer.js");
const Openai = require("openai");
const tesseract = require("tesseract.js");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors.js");
require("dotenv").config();

const userToken = "Verified Login";
const openai = new Openai({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post(
  "/sign-up",
  catchAsyncErrors(async (req, res) => {
    try {
      const { email, firstName, lastName, password } = req.body;

      const foundUser = await User.findOne({ email: email });

      if (foundUser) {
        return res.status(400).json("User already exists");
      }
      const salt = await bcrypt.genSalt(12);
      const hashedPass = await bcrypt.hash(password, salt);

      const user = {
        email: email,
        firstName: firstName,
        lastName: lastName,
        password: hashedPass,
      };

      await User.create(user);

      res.status(200).json({
        success: true,
        message: "User created successfully.",
        token: userToken,
      });
    } catch (err) {
      res.status(500).json(`Error message encountered: ${err}`);
      console.log(err);
    }
  })
);

router.post(
  "/login",
  catchAsyncErrors(async (req, res) => {
    try {
      const userEmail = req.body.email;

      const foundUser = await User.findOne({ email: userEmail }).maxTimeMS(
        50000
      );

      if (foundUser) {
        const validated = await bcrypt.compare(
          req.body.password,
          foundUser.password
        );
        if (!validated) {
          return res.status(400).json("Wrong credentials, try again");
        } else {
          res.status(200).json({
            success: true,
            user: foundUser,
            token: userToken,
          });
        }
      } else {
        return res.status(400).json("User doesn't exist");
      }
    } catch (err) {
      res.status(500).json(`Err encountered: ${err}`);
    }
  })
);

router.post(
  "/gpt-prompt",
  upload.single("image"),
  catchAsyncErrors(async (req, res) => {
    try {
      if (req.file) {
        const imagePath = req.file.path;
        const ocrResult = await tesseract.recognize(imagePath, "eng", {
          logger: (m) => console.log(m), // Optional: Log OCR progress
        });

        const extractedText = ocrResult.data.text;
        console.log("Extracted Text:", extractedText);

        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: extractedText,
              max_tokens: 1048,
            },
          ],
        });

        return res.status(200).json({
          success: true,
          result: response.choices[0].message.content,
        });
      }
      const { prompt } = req.body;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: prompt,
            max_tokens: 1048,
          },
        ],
      });
      res.status(200).json({
        success: true,
        result: response.choices[0].message.content,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        error: true,
        message: err.message,
      });
    }
  })
);

module.exports = router;
