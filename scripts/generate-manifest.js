const fs = require("fs");
const path = require("path");

const songsDir = path.join(__dirname, "..", "songs");
const manifestPath = path.join(songsDir, "manifest.json");

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getAlbums() {
  if (!fs.existsSync(songsDir)) {
    return {};
  }

  const albums = {};
  const folders = fs
    .readdirSync(songsDir, { withFileTypes: true })
    .filter(item => item.isDirectory())
    .map(item => item.name);

  for (const folder of folders) {
    const albumDir = path.join(songsDir, folder);
    const info = readJson(path.join(albumDir, "info.json"));
    const songs = fs
      .readdirSync(albumDir)
      .filter(file => path.extname(file).toLowerCase() === ".mp3")
      .sort((a, b) => a.localeCompare(b));

    albums[folder] = {
      title: info.title || folder,
      description: info.Description || info.description || "",
      cover: `songs/${folder}/cover.jpg`,
      folder: `songs/${folder}`,
      songs
    };
  }

  return albums;
}

fs.writeFileSync(manifestPath, JSON.stringify(getAlbums(), null, 2));
console.log(`Generated ${path.relative(process.cwd(), manifestPath)}`);
