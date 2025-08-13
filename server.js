// server.js
import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import fs from "fs";

dotenv.config();
const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// Text only submission
app.post("/submit", upload.fields([{ name: "document" }, { name: "images" }]), async (req, res) => {
  try {
    const { name, location, date, questionnaire } = req.body;

    const caption = `🕵️ *New Task Submitted*\n\n👤 Name: ${name}\n📍 Location: ${location}\n📅 Date: ${date}\n\n📝 ${questionnaire}`;

    // Send text message
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: caption,
        parse_mode: "Markdown"
      })
    });

    // Send document if exists
    if (req.files?.document) {
      for (let doc of req.files.document) {
        const formData = new FormData();
        formData.append("document", fs.createReadStream(doc.path), doc.originalname);
        formData.append("chat_id", CHAT_ID);

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
          method: "POST",
          body: formData
        });

        fs.unlinkSync(doc.path); // cleanup
      }
    }

    // Send images if exists
    if (req.files?.images) {
      for (let img of req.files.images) {
        const formData = new FormData();
        formData.append("photo", fs.createReadStream(img.path), img.originalname);
        formData.append("chat_id", CHAT_ID);

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
          method: "POST",
          body: formData
        });

        fs.unlinkSync(img.path); // cleanup
      }
    }

    res.json({ success: true, message: "Task submitted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
