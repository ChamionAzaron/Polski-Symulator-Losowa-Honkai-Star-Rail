// === konfiguracja ===
const pool = {
  "3": ["Arrows.png", "Adversarial.png", "Amber.png", "Void.png", "Shattered Home.png", "Shadowburn.png", "Sagacity.png", "Reminiscence.png", "Pioneering.png", "Passkey.png", "Multiplication.png", "Mutual Demise.png", "Meshing Cogs.png", "Mediation.png", "Loop.png", "Hidden Shadow.png", "Fine Fruit.png", "Defense.png", "Data Bank.png", "Darting Arrow.png", "Cornucopia.png", "Collapsing Sky.png", "Chorus.png"],
  "4": ["Tingyun.png", "Quingque.png", "Guinaifen.png", "Sushang.png"],
  "5_premium": ["Kafka.png"],
  "5_standard": ["Himeko.png", "Fu Xuan.png"]
};

// === muzyka ===
const musicList = ["Aquila.m4a", "Cocolia.m4a", "Lygus.m4a", "Phantylia.m4a", "Septimus.m4a"];
const musicBtn = document.getElementById("musicBtn");
const bgMusic = document.getElementById("bgMusic");
const musicStopBtn = document.getElementById("musicStopBtn");

musicBtn.addEventListener("click", playRandomMusic);
musicStopBtn.addEventListener("click", () => {
  bgMusic.pause();
  bgMusic.currentTime = 0;
});

function playRandomMusic() {
  let newTrack;
  do {
    newTrack = musicList[Math.floor(Math.random() * musicList.length)];
  } while (bgMusic.src.includes(newTrack));
  bgMusic.src = `music/${newTrack}`;
  bgMusic.play();
}

// === zmienne stanu ===
let totalRolls = 0;
let pityCounter = 0;
let guaranteePremium = false;
let win50 = 0;
let loss50 = 0;

// elementy DOM
const resultsDiv = document.getElementById("results");
const counterSpan = document.getElementById("counter");
const fiveStarsDiv = document.getElementById("fiveStars");
const rollBtn = document.getElementById("rollBtn");
const resetbtn = document.getElementById("resetbtn");
const counterSpanW = document.getElementById("counterwin");
const counterSpanL = document.getElementById("counterloss");
const counterPit = document.getElementById("counterPit");

// video
const videoOverlay = document.getElementById('videoOverlay');
const summonVideo = document.getElementById('summonVideo');

// odtwarzanie filmiku
function playSummonVideo(videoPath, callback) {
  summonVideo.src = videoPath;
  videoOverlay.style.display = 'flex';
  summonVideo.onended = () => {
    videoOverlay.style.display = 'none';
    summonVideo.src = '';
    if (callback) callback();
  };
  summonVideo.play();
}

// losowanie jednego przedmiotu z pity
function rollOne(forceFourStar = false, forceFiveStar = false, countPity = true) {
  if (countPity) pityCounter++;
  if (pityCounter >= 90 || forceFiveStar) {
    pityCounter = 0;
    return rollFiveStar();
  }
  let fiveStarChance = 0.6;
  if (pityCounter >= 75) {
    let extraChance = ((pityCounter - 74) / (90 - 74)) * (100 - 0.6);
    fiveStarChance = 0.6 + extraChance;
  }
  const rand = Math.random() * 100;
  if (rand < fiveStarChance) {
    pityCounter = 0;
    return rollFiveStar();
  } else if (rand < fiveStarChance + 5 || forceFourStar) {
    return getRandomFrom(pool["4"], "4");
  } else {
    return getRandomFrom(pool["3"], "3");
  }
}

// logika 50/50
function rollFiveStar() {
  let chosen;
  if (guaranteePremium) {
    chosen = getRandomFrom(pool["5_premium"], "5");
    guaranteePremium = false;
  } else {
    const rand = Math.random() * 100;
    if (rand < 56) {
      chosen = getRandomFrom(pool["5_premium"], "5");
    } else {
      chosen = getRandomFrom(pool["5_standard"], "5");
      guaranteePremium = true;
    }
  }
  return chosen;
}

// helper: losuje z listy obrazków
function getRandomFrom(arr, rarity) {
  const item = arr[Math.floor(Math.random() * arr.length)];
  return { rarity, name: item, src: `images/${item}` };
}

// reset wszystkiego
function resetAll() {
  resultsDiv.innerHTML = "";
  fiveStarsDiv.innerHTML = "";
  pityCounter = 0;
  totalRolls = 0;
  guaranteePremium = false;
  win50 = 0;
  loss50 = 0;
  counterSpan.textContent = 0;
  counterSpanW.textContent = 0;
  counterSpanL.textContent = 0;
  counterPit.textContent = 0;
}

// losowanie 10x
function rollTen() {
  resultsDiv.innerHTML = "";
  let rolls = [];
  let gotFourStar = false;
  let gotFiveStar = false;

  for (let i = 0; i < 10; i++) {
    const result = rollOne(false, false, false);
    rolls.push(result);
    if (result.rarity === "4") gotFourStar = true;
    if (result.rarity === "5") gotFiveStar = true;
  }

  // gwarantowana 4★
  if (!gotFourStar) {
    const possibleSlots = rolls.map((r, i) => r.rarity !== "5" ? i : null).filter(i => i !== null);
    const index = possibleSlots[Math.floor(Math.random() * possibleSlots.length)];
    rolls[index] = rollOne(true, false, false);
  }

  totalRolls += 10;
  counterSpan.textContent = totalRolls;

  // globalny filmik po losowaniu
  const globalVideo = gotFiveStar ? "summon_video/5star.mp4" : "summon_video/4star.mp4";
  playSummonVideo(globalVideo, () => {
    displayResults(rolls);
  });
}

// wyświetlanie wyników i odkrywanie
function displayResults(rolls) {
  resultsDiv.innerHTML = "";
  rolls.forEach(r => {
    const img = document.createElement("img");
    img.src = "images/question.png";
    img.style.cursor = "pointer";
    img.dataset.revealed = "false";

    img.addEventListener("click", function () {
      if (img.dataset.revealed === "true") return;
      img.dataset.revealed = "true";

      const playSFX = (file) => {
        const audio = new Audio(`sfx/${file}`);
        audio.play();
      };

      if (r.rarity === "5") {
        // Funkcja do odkrywania karty 5-gwiazdkowej
        const revealFiveStar = () => {
          img.src = r.src;
          img.style.borderColor = "gold";

          // dodanie do listy 5★
          const fiveImg = document.createElement("img");
          fiveImg.src = r.src;
          fiveStarsDiv.appendChild(fiveImg);

          // naliczanie pity i 50/50
          pityCounter = 0;
          counterPit.textContent = pityCounter;
          if (!guaranteePremium) win50++;
          else loss50++;
          counterSpanW.textContent = win50;
          counterSpanL.textContent = loss50;

          // odtworzenie dźwięku
          playSFX("5sfx.m4a");
        };

        // Sprawdzamy czy jest filmik w folderze 5starvideo
        const videoFile = `5starvideo/${r.name.replace(".png", "")}.mp4`;
        fetch(videoFile, { method: 'HEAD' })
          .then(res => {
            if (res.ok) {
              // Odtwarzamy filmik, a po zakończeniu odkrywamy kartę
              playSummonVideo(videoFile, revealFiveStar);
            } else {
              // Jeśli filmik nie istnieje, od razu odkrywamy kartę
              revealFiveStar();
            }
          })
          .catch(() => {
            // W przypadku błędu (np. brak sieci), odkrywamy kartę
            revealFiveStar();
          });

      } else {
        // 3★ lub 4★: fade-out question, pokazujemy kartę i sfx
        img.classList.add("fading-out");
        setTimeout(() => {
          img.src = r.src;
          img.style.borderColor = r.rarity === "4" ? "violet" : "grey";
          img.classList.remove("fading-out");
          playSFX(r.rarity === "3" ? "3sfx.m4a" : "4sfx.m4a");

          // naliczanie pity
          pityCounter++;
          counterPit.textContent = pityCounter;
        }, 400);
      }
    });

    resultsDiv.appendChild(img);
  });
}

// eventy
rollBtn.addEventListener("click", rollTen);
resetbtn.addEventListener("click", resetAll);