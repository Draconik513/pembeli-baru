let blowCount = 0;
const flame = document.getElementById("flame");
const message = document.getElementById("wishMessage");
const micStatus = document.getElementById("micStatus");
const fireParticlesContainer = document.getElementById("fireParticles");
const smokePuffElement = document.getElementById("smokePuff"); // Dapatkan elemen asap
const birthdaySong = document.getElementById("birthdaySong"); // Ambil audio

let audioContext;
let analyser;
let micSource;
let isExtinguished = false;
let blowDetectedTimer; // Untuk melacak durasi tiupan
const BLOW_THRESHOLD_VOLUME = 10; // Volume minimum untuk dianggap tiupan
const SUSTAINED_BLOW_DURATION = 1000; // Durasi tiupan (ms) agar api padam
const PARTICLE_EMIT_INTERVAL = 55; // Interval emisi partikel saat ditiup (ms)
let particleInterval; // Variabel untuk menyimpan interval emisi partikel

// === Tambahan: Unlock audio di klik pertama user ===
document.addEventListener(
  "click",
  () => {
    birthdaySong.play().then(() => {
      
      birthdaySong.currentTime = 0;   // ❌ jangan reset
      console.log("Audio unlocked ✅");
    }).catch((err) => {
      console.warn("Gagal unlock audio:", err);
    });
  },
  { once: true }
);


async function initMic() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    micStatus.textContent = "🎤 Microphone active. tiup lilin!";
    detectBlow(stream);
  } catch (err) {
    micStatus.textContent =
      "🚫 Microphone akses ditolak. tolong izinkan Microphone  untuk meniup lilin.";
    console.error("Error accessing microphone:", err);
  }
}

function createFireParticle() {
  const particle = document.createElement("div");
  particle.classList.add("fire-particle");
  const startX = Math.random() * 10 - 5;
  const startY = Math.random() * 5;
  particle.style.left = `${50 + (startX / 15) * 100}%`;
  particle.style.top = `${-15 + startY}px`;
  particle.style.width = `${Math.random() * 5 + 3}px`;
  particle.style.height = `${Math.random() * 8 + 5}px`;
  const dx = (Math.random() - 0.5) * 60;
  const dy = -(Math.random() * 40 + 30);
  particle.style.setProperty("--dx", `${dx}px`);
  particle.style.setProperty("--dy", `${dy}px`);
  fireParticlesContainer.appendChild(particle);
  particle.addEventListener("animationend", () => {
    particle.remove();
  });
}

function emitParticles() {
  clearInterval(particleInterval);
  particleInterval = setInterval(createFireParticle, PARTICLE_EMIT_INTERVAL);
}

function stopEmittingParticles() {
  clearInterval(particleInterval);
}

function detectBlow(stream) {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  micSource = audioContext.createMediaStreamSource(stream);
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.7;
  micSource.connect(analyser);
  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  function analyze() {
    if (isExtinguished) {
      if (micSource) micSource.disconnect();
      if (analyser) analyser.disconnect();
      if (audioContext) audioContext.close();
      return;
    }
    analyser.getByteFrequencyData(dataArray);
    const volume =
      dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;

    if (volume > BLOW_THRESHOLD_VOLUME) {
      if (!flame.classList.contains("blowing")) {
        flame.classList.add("blowing");
        emitParticles();
        blowDetectedTimer = setTimeout(() => {
          extinguishFlame();
        }, SUSTAINED_BLOW_DURATION);
      }
    } else {
      if (flame.classList.contains("blowing")) {
        flame.classList.remove("blowing");
        stopEmittingParticles();
        clearTimeout(blowDetectedTimer);
      }
    }
    requestAnimationFrame(analyze);
  }
  analyze();
}

function extinguishFlame() {
  if (isExtinguished) return;
  flame.classList.remove("blowing");
  flame.classList.add("extinguished");
  isExtinguished = true;
  stopEmittingParticles();
  message.classList.remove("hidden");
  message.textContent = "Hore! Lilinnya padam! ";

  // ✅ Atur mode pemutaran lagu
  // Jika ingin lagu ulang tahun diputar berulang, set loop = true
  // Jika ingin sekali play tapi bisa diulang di-refresh, biarkan false
  birthdaySong.loop = true;   // ubah ke false kalau mau hanya sekali
  birthdaySong.currentTime = 0; // mulai dari awal
  birthdaySong.play().catch((error) => {
    console.warn("Autoplay prevented:", error);
  });

  smokePuffElement.style.opacity = 1;
  smokePuffElement.style.animation = "smoke-rise 1s forwards ease-out";
  if (micSource) micSource.disconnect();
  if (analyser) analyser.disconnect();
  if (audioContext) audioContext.close();
}


window.onload = initMic;

