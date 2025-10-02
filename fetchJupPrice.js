import fetch from "node-fetch";
import { loadGistFile, updateGistFiles, updateHourlyGist } from "./gist.js";

// Token mint -> CSV file mapping
const TOKENS = {
  "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN": "jupPrices.csv",
  "pumpCmXqMfrsAkQ5r49WcJnRayYRqmXz6ae8H7H9Dfn": "pumpPrices.csv",
  "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263": "bonkPrices.csv",
  "2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv": "penguPrices.csv",
  "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R": "rayPrices.csv",
  "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm": "wifPrices.csv",
  "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr": "popcatPrices.csv",
  "J3NKxxXZcnNiMjKw9hYb2K4LUxgwB6t1FtPtQVsv3KFr": "spxPrices.csv",
  "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump": "fartPrices.csv",
  "27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4": "jlpPrices.csv"
};

const API_URL = `https://lite-api.jup.ag/price/v3?ids=${Object.keys(TOKENS).join(",")}`;

export async function fetchAndSavePrices() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  const iso = new Date().toISOString();
  const updates = {};

  // --- 3-min Gist updates ---
  for (const [mint, filename] of Object.entries(TOKENS)) {
    const obj = data[mint];
    if (!obj || typeof obj.usdPrice !== "number") continue;

    const price = obj.usdPrice;
    let rows = await loadGistFile(filename);
    rows.push(`${iso},${price}`);

    const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000; // 3 days
    const header = rows[0];
    rows = [header].concat(
      rows.slice(1).filter(r => {
        const t = new Date(r.split(",")[0]).getTime();
        return !isNaN(t) && t >= cutoff;
      })
    );

    updates[filename] = { content: rows.join("\n") + "\n" };
    console.log(`Updated ${filename} with ${price} at ${iso}`);
  }

  if (Object.keys(updates).length > 0) {
    await updateGistFiles(updates);
  }

  // --- Hourly snapshot with history (append rows, keep 15 days) ---
  const now = new Date();
  if (now.getMinutes() === 0) {
    const hourlyUpdates = {};
    const cutoffHourly = Date.now() - 15 * 24 * 60 * 60 * 1000; // 15 days

    for (const [mint, filename] of Object.entries(TOKENS)) {
      const obj = data[mint];
      if (!obj || typeof obj.usdPrice !== "number") continue;

      const price = obj.usdPrice;
      const hourlyFilename = filename.replace(".csv", "_hourly.csv");

      // Load existing hourly rows
      let rows = await loadGistFile(hourlyFilename, process.env.HOURLY_GIST_ID);
      rows.push(`${iso},${price}`);

      // Keep only last 15 days
      const header = rows[0];
      rows = [header].concat(
        rows.slice(1).filter(r => {
          const t = new Date(r.split(",")[0]).getTime();
          return !isNaN(t) && t >= cutoffHourly;
        })
      );

      hourlyUpdates[hourlyFilename] = { content: rows.join("\n") + "\n" };
      console.log(`Hourly snapshot updated: ${hourlyFilename} = ${price} at ${iso}`);
    }

    if (Object.keys(hourlyUpdates).length > 0) {
      await updateHourlyGist(hourlyUpdates);
    }
  }
}
