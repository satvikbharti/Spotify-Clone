console.log("Lets write Javascript");

let currentSong = new Audio();
let songs = [];
let albums = {};
let currFolder = "";
let currentTrack = "";
let isSeeking = false;

const playButton = document.getElementById("play");
const previousButton = document.getElementById("previous");
const nextButton = document.getElementById("next");
const songSearch = document.getElementById("songSearch");
const navbarSearch = document.getElementById("navbarSearch");
const songList = document.querySelector(".songsList ul");
const libraryStatus = document.querySelector(".library-status");
const songInfo = document.querySelector(".songinfo");
const songTime = document.querySelector(".songtime");
const seekbar = document.querySelector(".seekbar");
const circle = document.querySelector(".circle");
const volumeSlider = document.querySelector(".range input");
const volumeIcon = document.querySelector(".volume>img");

function getSongFileName(songPath) {
  const cleanPath = decodeURIComponent(String(songPath))
    .split("?")[0]
    .split("#")[0]
    .replaceAll("\\", "/");

  return cleanPath.split("/").filter(Boolean).pop() || "";
}

function getCurrentAlbum() {
  return Object.values(albums).find(album => album.folder === currFolder);
}

function getAllSongResults(searchText = "") {
  const query = searchText.trim().toLowerCase();
  const results = [];

  for (const album of Object.values(albums)) {
    for (const song of album.songs) {
      const searchableText = `${song} ${album.title} ${album.artist || ""}`.toLowerCase();

      if (!query || searchableText.includes(query)) {
        results.push({
          song,
          folder: album.folder,
          album
        });
      }
    }
  }

  return results;
}

function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(remainingSeconds).padStart(2, "0");

  return `${formattedMinutes}:${formattedSeconds}`;
}

function setStatus(message) {
  libraryStatus.textContent = message;
}

async function loadAlbums() {
  setStatus("Loading songs...");

  try {
    const response = await fetch("songs/manifest.json");
    if (!response.ok) {
      throw new Error(`Manifest request failed: ${response.status}`);
    }

    albums = await response.json();
    setStatus("");
  } catch (error) {
    albums = {};
    setStatus("Could not load songs. Run npm run build and refresh.");
    console.log("Album manifest error:", error);
  }
}

function renderSongs(filterText = "") {
  const searchText = filterText.trim().toLowerCase();
  const visibleSongs = searchText
    ? getAllSongResults(searchText)
    : songs.map(song => ({ song, folder: currFolder, album: getCurrentAlbum() }));

  songList.innerHTML = "";

  if (!songs.length) {
    setStatus("No songs found in this album.");
    return;
  }

  if (!visibleSongs.length) {
    setStatus("No matching songs.");
    return;
  }

  setStatus("");

  if (searchText) {
    setStatus(`Showing ${visibleSongs.length} result${visibleSongs.length === 1 ? "" : "s"} from all albums.`);
  }

  for (const result of visibleSongs) {
    const isActive = result.song === currentTrack && result.folder === currFolder ? " active-song" : "";
    songList.innerHTML += `<li class="song-item${isActive}" data-song="${result.song}" data-folder="${result.folder}">
        <img class="invert" src="music.svg" alt="">
        <div class="info">
            <div>${result.song}</div>
            <div>${result.album?.title || "Album"} - ${result.album?.artist || "Various Artists"}</div>
        </div>
        <div class="playnow">
            <span>${result.song === currentTrack && result.folder === currFolder && !currentSong.paused ? "Playing" : "Play now"}</span>
            <img src="${result.song === currentTrack && result.folder === currFolder && !currentSong.paused ? "pause.svg" : "play.svg"}" alt="">
        </div>
    </li>`;
  }

  Array.from(document.querySelectorAll(".song-item")).forEach(item => {
    item.addEventListener("click", async () => {
      if (item.dataset.folder !== currFolder) {
        await getSongs(item.dataset.folder);
      }

      playMusic(item.dataset.song);
    });
  });
}

async function getSongs(folder) {
  currFolder = folder;
  const album = getCurrentAlbum();
  songs = album ? album.songs : [];
  renderSongs(songSearch.value);
  return songs;
}

function updateActiveSong() {
  renderSongs(songSearch.value);
}

function setPlayIcon(isPlaying) {
  playButton.src = isPlaying ? "pause.svg" : "play.svg";
}

function setVolume(value) {
  const volume = Math.max(0, Math.min(1, value));
  currentSong.volume = volume;
  volumeSlider.value = Math.round(volume * 100);
  volumeIcon.src = volumeIcon.src.replace(volume > 0 ? "mute.svg" : "volume.svg", volume > 0 ? "volume.svg" : "mute.svg");
}

function changeVolume(step) {
  setVolume(currentSong.volume + step);
}

function syncSearch(value) {
  songSearch.value = value;
  navbarSearch.value = value;
  renderSongs(value);
}

const playMusic = (track, pause = false) => {
  const songFileName = getSongFileName(track);
  if (!songFileName) {
    setStatus("No song selected.");
    return;
  }

  currentTrack = songFileName;
  currentSong.src = new URL(`${currFolder}/${encodeURIComponent(songFileName)}`, window.location.href).href;
  songInfo.textContent = songFileName;
  songTime.textContent = "00:00 / 00:00";
  circle.style.left = "0%";
  updateActiveSong();

  if (!pause) {
    currentSong.play()
      .then(() => {
        setPlayIcon(true);
        updateActiveSong();
      })
      .catch(error => {
        console.log("Song could not play:", currentSong.src, error);
        setPlayIcon(false);
      });
  }
};

async function displayAlbums() {
  const cardcontainer = document.querySelector(".cardcontainer");
  cardcontainer.innerHTML = "";

  for (const [folder, album] of Object.entries(albums)) {
    cardcontainer.innerHTML += `<div data-folder="${folder}" class="card">
        <div class="play">
            <svg width="50" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="#1ED760" />
                <polygon points="40,30 40,70 70,50" fill="black" />
            </svg>
        </div>
        <img src="${album.cover}" alt="${album.title}">
        <h2>${album.title}</h2>
        <p>${album.description || "Songs for you"}</p>
        <p class="album-meta">${album.artist || "Various Artists"}${album.year ? ` - ${album.year}` : ""}</p>
    </div>`;
  }
}

function playSongAtOffset(offset) {
  const index = songs.indexOf(currentTrack);
  const nextIndex = index + offset;

  if (nextIndex >= 0 && nextIndex < songs.length) {
    playMusic(songs[nextIndex]);
  }
}

function seekToPointer(event) {
  const rect = seekbar.getBoundingClientRect();
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));

  circle.style.left = `${percent}%`;

  if (!isNaN(currentSong.duration)) {
    currentSong.currentTime = (currentSong.duration * percent) / 100;
  }
}

async function main() {
  await loadAlbums();

  const firstAlbum = Object.values(albums)[0];
  if (!firstAlbum) {
    setStatus("No albums found. Add folders inside songs/ and run npm run build.");
    return;
  }

  await getSongs(firstAlbum.folder);
  playMusic(songs[0], true);
  await displayAlbums();

  playButton.addEventListener("click", () => {
    if (!currentSong.src && songs[0]) {
      playMusic(songs[0]);
      return;
    }

    if (currentSong.paused) {
      currentSong.play()
        .then(() => {
          setPlayIcon(true);
          updateActiveSong();
        })
        .catch(error => {
          console.log("Song could not play:", currentSong.src, error);
          setPlayIcon(false);
        });
    } else {
      currentSong.pause();
      setPlayIcon(false);
      updateActiveSong();
    }
  });

  currentSong.addEventListener("error", () => {
    console.log("Audio loading error:", currentSong.src, currentSong.error);
    setPlayIcon(false);
    setStatus("This song could not be loaded.");
  });

  currentSong.addEventListener("ended", () => {
    const index = songs.indexOf(currentTrack);
    if (index + 1 < songs.length) {
      playMusic(songs[index + 1]);
    } else {
      setPlayIcon(false);
      updateActiveSong();
    }
  });

  currentSong.addEventListener("timeupdate", () => {
    songTime.textContent = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;

    if (!isSeeking && !isNaN(currentSong.duration)) {
      circle.style.left = `${(currentSong.currentTime / currentSong.duration) * 100}%`;
    }
  });

  seekbar.addEventListener("click", seekToPointer);
  seekbar.addEventListener("pointerdown", event => {
    isSeeking = true;
    seekbar.setPointerCapture(event.pointerId);
    seekToPointer(event);
  });
  seekbar.addEventListener("pointermove", event => {
    if (isSeeking) {
      seekToPointer(event);
    }
  });
  seekbar.addEventListener("pointerup", event => {
    isSeeking = false;
    seekbar.releasePointerCapture(event.pointerId);
  });

  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });

  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-120%";
  });

  previousButton.addEventListener("click", () => {
    currentSong.pause();
    playSongAtOffset(-1);
  });

  nextButton.addEventListener("click", () => {
    currentSong.pause();
    playSongAtOffset(1);
  });

  setVolume(1);
  volumeSlider.addEventListener("input", event => {
    setVolume(parseInt(event.target.value) / 100);
  });

  currentSong.addEventListener("volumechange", () => {
    volumeSlider.value = Math.round(currentSong.volume * 100);
    volumeIcon.src = volumeIcon.src.replace(currentSong.volume > 0 ? "mute.svg" : "volume.svg", currentSong.volume > 0 ? "volume.svg" : "mute.svg");
  });

  Array.from(document.getElementsByClassName("card")).forEach(card => {
    card.addEventListener("click", async event => {
      await getSongs(`songs/${event.currentTarget.dataset.folder}`);
      playMusic(songs[0]);
    });
  });

  volumeIcon.addEventListener("click", event => {
    if (event.target.src.includes("volume.svg")) {
      setVolume(0);
    } else {
      setVolume(0.1);
    }
  });

  songSearch.addEventListener("input", event => syncSearch(event.target.value));
  navbarSearch.addEventListener("input", event => syncSearch(event.target.value));

  document.addEventListener("keydown", event => {
    if (event.target.closest?.("input, textarea")) {
      return;
    }

    if (event.key === "ArrowUp" || event.key === "+" || event.key === "=") {
      event.preventDefault();
      changeVolume(0.05);
    }

    if (event.key === "ArrowDown" || event.key === "-") {
      event.preventDefault();
      changeVolume(-0.05);
    }

    if (event.key.toLowerCase() === "m") {
      event.preventDefault();
      setVolume(currentSong.volume > 0 ? 0 : 0.1);
    }
  });
}

main();
