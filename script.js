console.log('Lets write Javascript');

let currentSong = new Audio();

let songs;

let currFolder;

let albums = {};
const playButton = document.getElementById("play");
const previousButton = document.getElementById("previous");
const nextButton = document.getElementById("next");

function getSongFileName(songPath) {
  const cleanPath = decodeURIComponent(String(songPath))
    .split("?")[0]
    .split("#")[0]
    .replaceAll("\\", "/");

  return cleanPath.split("/").filter(Boolean).pop();
}

function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');

  return `${formattedMinutes}:${formattedSeconds}`;
}

async function loadAlbums() {
  let response = await fetch("songs/manifest.json");
  albums = await response.json();
}

async function getSongs(folder) {
  currFolder = folder;
  const album = Object.values(albums).find(album => album.folder === folder);
  songs = album ? album.songs : []

  //Show all songs in the playlist
  let songUL = document.querySelector(".songsList").getElementsByTagName("ul")[0]
  songUL.innerHTML = ""
  for (const song of songs) {
    songUL.innerHTML = songUL.innerHTML + `<li data-song="${song}">
    
    
                            <img class="invert " src="music.svg" alt="">
                            <div class="info">
                                <div>  ${song.replaceAll("%20", " ")}</div>

                                <div> Satvik </div>
                            </div>
                            <div class="playnow">
                                <span>Play now</span>
                            <img src="play.svg" alt="">
                            </div>
                        
   </li>`;
  }


  //Attach an event listener to each song
  Array.from(document.querySelector(".songsList").getElementsByTagName("li")).forEach(e => {
    e.addEventListener("click", element => {

      playMusic(e.dataset.song)

    })
  })
 return songs;
}

const playMusic = (track, pause = false) => {
  const songFileName = getSongFileName(track);
  currentSong.src = new URL(`${currFolder}/${encodeURIComponent(songFileName)}`, window.location.href).href
  if (!pause) {
    currentSong.play()
      .then(() => {
        playButton.src = "pause.svg"
      })
      .catch(error => {
        console.log("Song could not play:", currentSong.src, error)
        playButton.src = "play.svg"
      })
  }
  document.querySelector(".songinfo").innerHTML = songFileName
  document.querySelector(".songtime").innerHTML = "00:00 / 00:00"

}

async function displayAlbums() {
  let cardcontainer = document.querySelector(".cardcontainer")
  cardcontainer.innerHTML = ""

  for (const [folder, album] of Object.entries(albums)) {
    cardcontainer.innerHTML = cardcontainer.innerHTML +  ` <div data-folder="${folder}" class="card ">
                        <div class="play">
                            <svg width="50" height="100" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="#1ED760" />
                                <polygon points="40,30 40,70 70,50" fill="black" />
                            </svg>
                        </div>
                        <img src="${album.cover}" alt="">
                        <h2>${album.title}</h2>
                            
                        <a draggable="true" dir="auto" href="/artist/3GdSQUH1BRtl9UrrtuwJlP">Irshad Kamil</a>,
                        <a draggable="true" dir="auto" href="/artist/05etL4pzWd6TSv1x5WrlG3">Faheem Abdullah</a>,
                        <a draggable="true" dir="auto" href="/artist/5yzqUq3vXrMkmfcOY203">Arslan Nizami</a> ,
                        <a draggable="true" dir="auto" href="/artist/3GdSQUH1BRtl9UrrtuwJlP">Irshad Kamil </a>
                    </div> 
                    
                    `
  }

}

async function main() {

  await loadAlbums()
  const firstAlbum = Object.values(albums)[0]
  if (!firstAlbum) {
    console.log("No albums found. Add folders inside songs/ and run npm run build.")
    return
  }

  //Get the list of all the songs
  await getSongs(firstAlbum.folder)

  playMusic(songs[0], true)

  await displayAlbums()


  // Attach an event listener to play, next and previous
  playButton.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play()
        .then(() => {
          playButton.src = "pause.svg"
        })
        .catch(error => {
          console.log("Song could not play:", currentSong.src, error)
          playButton.src = "play.svg"
        })
    }
    else {
      currentSong.pause()
      playButton.src = "play.svg"
    }
  })

  currentSong.addEventListener("error", () => {
    console.log("Audio loading error:", currentSong.src, currentSong.error)
    playButton.src = "play.svg"
  })

  //Listen for timeupdate event
  currentSong.addEventListener("timeupdate", () => {

    document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)} `
    document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
  })



  // Add an event listener to seekbar
  document.querySelector(".seekbar").addEventListener("click", e => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentSong.currentTime = ((currentSong.duration) * percent) / 100
  })



  // Add an event listener for hamburger
  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0"
  })


  // Add an event listener for close button
  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-120%";

  })

  // Add an event listener to previous
  previousButton.addEventListener("click", () => {
    currentSong.pause()
    console.log("Previous clicked")
    let index = songs.indexOf(getSongFileName(currentSong.src))
    if ((index - 1) >= 0) {
      playMusic(songs[index - 1])
    }
  })

  // Add an event listener to next
  nextButton.addEventListener("click", () => {
    currentSong.pause()
    console.log("Next clicked")

    let index = songs.indexOf(getSongFileName(currentSong.src))

    if ((index + 1) < songs.length) {
      playMusic(songs[index + 1])
    }
  })


  //Add an event to volume
  document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
    console.log("Setting volume to", e.target.value, "/ 100")
    currentSong.volume = parseInt(e.target.value) / 100
   if (currentSong.volume >0){
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("mute.svg", "volume.svg")
        }
  })

 //load the playlist whenever card is clicked
  Array.from(document.getElementsByClassName("card")).forEach(e => {
    e.addEventListener("click", async item => {
      console.log("Fetching Songs")
      songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`)
     playMusic(songs[0])

    })
  })

  //Add event listner to mute the track
document.querySelector(".volume>img").addEventListener("click" , e=>{
  if(e.target.src.includes("volume.svg")){
    e.target.src =   e.target.src.replace("volume.svg" , "mute.svg")
    currentSong.volume = 0;
      document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
  }
  else{
    e.target.src =   e.target.src.replace("mute.svg" , "volume.svg")
    currentSong.volume = .10;
      document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
  }
})
}


main()
