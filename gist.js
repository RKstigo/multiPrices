import fetch from "node-fetch";

const GIST_ID = process.env.GIST_ID;
const GH_TOKEN = process.env.GH_TOKEN;

export async function loadGistFile(filename) {
  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: { Authorization: `token ${GH_TOKEN}` }
  });
  if (!res.ok) throw new Error(`Failed to load gist: ${res.status}`);
  const gist = await res.json();
  const file = gist.files[filename];
  if (!file) return ["timestamp,price"];
  return file.content.trim().split("\n");
}

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
