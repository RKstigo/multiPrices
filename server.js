import express from "express";
import { fetchAndSavePrices } from "./fetchJupPrice.js";

const app = express();

app.get("/tick", async (req, res) => {
  try {
    await fetchAndSavePrices();
    res.send("Tick success");
  } catch (err) {
    console.error("Tick failed:", err.message);
    res.status(500).send("Tick failed: " + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
