import fetch from "node-fetch";

const GIST_ID = process.env.GIST_ID;
const GH_TOKEN = process.env.GH_TOKEN;

// Load a file from a Gist, optionally specifying a different Gist ID (e.g., hourly Gist)
export async function loadGistFile(filename, gistId = GIST_ID) {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: { Authorization: `token ${GH_TOKEN}` }
  });
  if (!res.ok) throw new Error(`Failed to load gist: ${res.status}`);
  const gist = await res.json();
  const file = gist.files[filename];
  if (!file) return ["timestamp,price"];
  return file.content.trim().split("\n");
}

// Update the normal 3-min Gist
export async function updateGistFiles(updates) {
  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: "PATCH",
    headers: {
      Authorization: `token ${GH_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ files: updates })
  });
  if (!res.ok) throw new Error(`Failed to update gist: ${res.status}`);
}

// Update the hourly snapshot Gist
export async function updateHourlyGist(updates) {
  const HOURLY_GIST_ID = process.env.HOURLY_GIST_ID;

  const res = await fetch(`https://api.github.com/gists/${HOURLY_GIST_ID}`, {
    method: "PATCH",
    headers: {
      Authorization: `token ${GH_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ files: updates })
  });

  if (!res.ok) throw new Error(`Failed to update hourly gist: ${res.status}`);
}
