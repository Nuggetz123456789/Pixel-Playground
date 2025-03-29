// Welcome Page
const welcomePage = document.getElementById('welcomePage');
const mainApp = document.getElementById('mainApp');
const startBtn = document.getElementById('startBtn');

// Add a class to body to indicate welcome screen is active
document.body.classList.add('welcome-active');

startBtn.addEventListener('click', () => {
  welcomePage.style.display = 'none';
  mainApp.style.display = 'block';
  mainApp.classList.add('active');
  setTimeout(() => mainApp.classList.remove('hidden'), 10);
  playSound('start');
  // Remove welcome-active class after transitioning to main app
  document.body.classList.remove('welcome-active');
});

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
let isDark = false;
themeToggle.addEventListener('click', () => {
  isDark = !isDark;
  document.body.classList.toggle('dark');
  mainApp.classList.toggle('dark');
  themeToggle.textContent = isDark ? '☀️' : '🌙';
});

// Sound Toggle
const soundToggle = document.getElementById('soundToggle');
let soundOn = true;
soundToggle.addEventListener('click', () => {
  soundOn = !soundOn;
  soundToggle.textContent = soundOn ? '🔊' : '🔇';
});

// Navigation
const navButtons = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');

navButtons.forEach(button => {
  button.addEventListener('click', () => {
    navButtons.forEach(btn => btn.classList.remove('active'));
    pages.forEach(page => page.classList.remove('active'));
    button.classList.add('active');
    document.getElementById(button.dataset.page).classList.add('active');
  });
});

// Hex Extractor
const imageInput = document.getElementById('imageInput');
const canvas = document.getElementById('canvas');
const hexList = document.getElementById('hexList');
const hexGrid = document.getElementById('hexGrid');
const gridContent = document.getElementById('gridContent');
const sectionIndicator = document.getElementById('sectionIndicator');
const toggleView = document.getElementById('toggleView');
const popup = document.getElementById('popup');
const progress = document.getElementById('progress');
const progressText = document.getElementById('progressText');
const stopwatch = document.getElementById('stopwatch');
const ctx = canvas.getContext('2d');
let isGridView = false;
let currentSection = 0;
let hexData = [];
let copiedCount = new Set();
let timerInterval = null;
let startTime = null;

imageInput.addEventListener('change', handleImageUpload);
toggleView.addEventListener('click', toggleHexView);

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const img = new Image();
  const reader = new FileReader();

  reader.onload = function(e) {
    img.src = e.target.result;
  };

  img.onload = function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, 32, 32);
    const imageData = ctx.getImageData(0, 0, 32, 32).data;
    storeHexCodes(imageData);
    displayHexCodes();
    startStopwatch();
  };

  reader.readAsDataURL(file);
}

function storeHexCodes(imageData) {
  hexData = [];
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const index = (y * 32 + x) * 4;
      const r = imageData[index];
      const g = imageData[index + 1];
      const b = imageData[index + 2];
      const hex = rgbToHex(r, g, b);
      hexData.push({ x, y, hex });
    }
  }
  currentSection = 0;
  copiedCount.clear();
  updateProgress();
}

function displayHexCodes() {
  hexList.innerHTML = '';
  gridContent.innerHTML = '';

  hexData.forEach(({ x, y, hex }) => {
    const listItem = document.createElement('div');
    listItem.className = 'hex-item';
    listItem.innerHTML = `
      <div class="color-swatch" style="background-color: ${hex}"></div>
      <span>(${x}, ${y}): ${hex}</span>
    `;
    hexList.appendChild(listItem);
  });

  if (isGridView) displaySection();
}

function displaySection() {
  gridContent.innerHTML = '';
  const sectionRow = Math.floor(currentSection / 4);
  const sectionCol = currentSection % 4;
  const sectionX = sectionCol * 8;
  const sectionY = sectionRow * 8;
  sectionIndicator.textContent = `Section ${currentSection + 1}/16 (${sectionX}-${sectionX + 7}, ${sectionY}-${sectionY + 7})`;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const img = new Image();
  img.src = canvas.toDataURL();
  img.onload = () => {
    ctx.drawImage(img, 0, 0, 32, 32);
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 2;
    ctx.strokeRect(sectionX, sectionY, 8, 8);
  };

  for (let y = sectionY; y < sectionY + 8; y++) {
    for (let x = sectionX; x < sectionX + 8; x++) {
      const i = y * 32 + x;
      const { hex } = hexData[i];
      const gridItem = document.createElement('div');
      gridItem.className = 'hex-grid-item';
      gridItem.style.backgroundColor = hex;
      gridItem.textContent = hex.slice(1);
      gridItem.dataset.index = i;
      if (copiedCount.has(i)) gridItem.classList.add('copied');
      gridItem.addEventListener('click', () => {
        navigator.clipboard.writeText(hex);
        gridItem.classList.add('copied');
        copiedCount.add(parseInt(gridItem.dataset.index));
        gridItem.textContent = 'Copied';
        playSound('click');
        setTimeout(() => gridItem.textContent = hex.slice(1), 1000);
        checkSectionComplete();
      });
      gridContent.appendChild(gridItem);
    }
  }
}

function checkSectionComplete() {
  const copiedItems = gridContent.querySelectorAll('.hex-grid-item.copied');
  if (copiedItems.length === 64) {
    playSound('cheer');
    if (currentSection < 15) {
      currentSection++;
      showPopup(`Section ${currentSection} Cleared! Onward and upward!`);
      setTimeout(() => {
        displaySection();
        updateProgress();
      }, 2000);
    } else {
      showPopup('Victory! You’ve conquered all 1024 hexes! Amazing job!');
      stopStopwatch();
      updateProgress();
      launchConfetti();
    }
  }
}

function showPopup(message) {
  popup.textContent = message;
  popup.style.display = 'block';
  setTimeout(() => popup.style.display = 'none', 2000);
}

function toggleHexView() {
  isGridView = !isGridView;
  hexList.style.display = isGridView ? 'none' : 'block';
  hexGrid.style.display = isGridView ? 'block' : 'none';
  toggleView.textContent = isGridView ? 'Toggle List View' : 'Toggle Grid View';
  if (isGridView) displaySection();
}

function updateProgress() {
  const completedSections = currentSection + (currentSection === 15 && gridContent.querySelectorAll('.hex-grid-item.copied').length === 64 ? 1 : 0);
  const progressPercentage = (completedSections / 16) * 100;
  progress.style.width = `${progressPercentage}%`;
  progressText.textContent = `${completedSections}/16 Sections Complete`;
}

function startStopwatch() {
  if (timerInterval) clearInterval(timerInterval);
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const seconds = String(elapsed % 60).padStart(2, '0');
    stopwatch.textContent = `Time: ${minutes}:${seconds}`;
  }, 1000);
}

function stopStopwatch() {
  if (timerInterval) clearInterval(timerInterval);
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

// Sound Effects
function playSound(type) {
  // Sound files not included, so do nothing
  console.log(`Sound effect "${type}" would play here if sound files were included.`);
}

// Confetti and Background Particles
const confettiCanvas = document.getElementById('confettiCanvas');
const confettiCtx = confettiCanvas.getContext('2d');
let particles = [];
let backgroundParticles = [];

function resizeConfetti() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeConfetti);
resizeConfetti();

// Background Particles
function initBackgroundParticles() {
  backgroundParticles = [];
  for (let i = 0; i < 20; i++) {
    backgroundParticles.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * confettiCanvas.height,
      size: Math.random() * 3 + 1,
      speedX: Math.random() * 0.5 - 0.25,
      speedY: Math.random() * 0.5 - 0.25,
      color: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`
    });
  }
}

initBackgroundParticles();

function launchConfetti() {
  particles = [];
  for (let i = 0; i < 100; i++) {
    particles.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * confettiCanvas.height - confettiCanvas.height,
      size: Math.random() * 5 + 2,
      speedX: Math.random() * 3 - 1.5,
      speedY: Math.random() * 5 + 2,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`
    });
  }
}

function animateParticles() {
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

  // Background Particles
  backgroundParticles.forEach(p => {
    confettiCtx.fillStyle = p.color;
    confettiCtx.beginPath();
    confettiCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    confettiCtx.fill();
    p.x += p.speedX;
    p.y += p.speedY;
    if (p.x < 0 || p.x > confettiCanvas.width) p.speedX *= -1;
    if (p.y < 0 || p.y > confettiCanvas.height) p.speedY *= -1;
  });

  // Confetti Particles
  particles.forEach((p, i) => {
    confettiCtx.fillStyle = p.color;
    confettiCtx.beginPath();
    confettiCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    confettiCtx.fill();
    p.x += p.speedX;
    p.y += p.speedY;
    p.speedY += 0.1; // Gravity
    if (p.y > confettiCanvas.height) particles.splice(i, 1);
  });

  requestAnimationFrame(animateParticles);
}

animateParticles();

// Color Picker
const pickerImageInput = document.getElementById('pickerImageInput');
const pickerCanvas = document.getElementById('pickerCanvas');
const pickedColor = document.getElementById('pickedColor');
const pickerCtx = pickerCanvas.getContext('2d');

pickerImageInput.addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const img = new Image();
  const reader = new FileReader();

  reader.onload = function(e) {
    img.src = e.target.result;
  };

  img.onload = function() {
    pickerCtx.clearRect(0, 0, pickerCanvas.width, pickerCanvas.height);
    pickerCtx.imageSmoothingEnabled = false;
    pickerCtx.drawImage(img, 0, 0, 32, 32);
  };

  reader.readAsDataURL(file);
});

pickerCanvas.addEventListener('click', function(event) {
  const rect = pickerCanvas.getBoundingClientRect();
  const x = Math.floor((event.clientX - rect.left) * (32 / rect.width));
  const y = Math.floor((event.clientY - rect.top) * (32 / rect.height));
  const pixel = pickerCtx.getImageData(x, y, 1, 1).data;
  const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
  pickedColor.style.backgroundColor = hex;
  pickedColor.textContent = hex;
  playSound('click');
});
