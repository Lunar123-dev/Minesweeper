/* ============================================================
   DÒ MÌN — HTML + CSS + JS
   ============================================================ */

/* ---------- CẤU HÌNH ---------- */
const LEVELS = {
  easy:   { size: 10, mines: 12 },
  medium: { size: 25, mines: 90 },
  hard:   { size: 50, mines: 380 },
};

const MINE_STYLES = [
  { id: 'mine1', label: 'Bom',   src: 'assets/mines/mine1.svg' },
  { id: 'mine2', label: 'Đen',   src: 'assets/mines/mine2.svg' },
  { id: 'mine3', label: 'Neon',  src: 'assets/mines/mine3.svg' },
];

const FLAG_STYLES = [
  { id: 'flag1', label: 'Đỏ',    src: 'assets/flags/flag1.svg' },
  { id: 'flag2', label: 'Xanh',  src: 'assets/flags/flag2.svg' },
  { id: 'flag3', label: 'Vàng',  src: 'assets/flags/flag3.svg' },
];

const BG_STYLES = [
  { id: 'bg1', label: 'ảnh1',    src: 'assets/backgrounds/bg1.jpg' },
  { id: 'bg2', label: 'ảnh2',   src: 'assets/backgrounds/bg2.jpg' },
  { id: 'bg3', label: 'ảnh3',   src: 'assets/backgrounds/bg3.jpg' },
  { id: 'none', label: 'mặc định',  src: '' },
];

const STORAGE_KEY = 'minesweeper_settings_v1';

/* ---------- STATE ---------- */
const state = {
  level: 'easy',
  size: 10,
  mines: 12,
  board: [],          // [{ mine, open, flag, adj }]
  started: false,
  over: false,
  flags: 0,
  openedSafe: 0,
  timer: 0,
  timerId: null,
  flagMode: false,
  mineStyle: 'mine1',
  flagStyle: 'flag1',
  bgStyle: 'none',
  musicOn: false,
  volume: 0.4,
  sfxOn: true,          // bật/tắt hiệu ứng âm thanh
  sfxVolume: 0.7,       // âm lượng SFX riêng
};

/* ---------- DOM ---------- */
const $ = (s) => document.querySelector(s);
const boardEl     = $('#board');
const boardWrap   = $('#boardWrap');
const mineCountEl = $('#mineCount');
const timerEl     = $('#timer');
const btnNew      = $('#btnNew');
const btnFlagMode = $('#btnFlagMode');
const btnMusic    = $('#btnMusic');
const btnSettings = $('#btnSettings');
const panel       = $('#panel');
const panelBackdrop = $('#panelBackdrop');
const btnClosePanel = $('#btnClosePanel');
const overlay     = $('#overlay');
const overlayEmoji= $('#overlayEmoji');
const overlayTitle= $('#overlayTitle');
const overlayText = $('#overlayText');
const btnPlayAgain= $('#btnPlayAgain');
const mineSwatches= $('#mineSwatches');
const flagSwatches= $('#flagSwatches');
const bgSwatches  = $('#bgSwatches');
const levelSeg    = $('#levelSeg');
const bgm         = $('#bgm');
const sfxClick = $('#sfxClick');
const sfxFlag  = $('#sfxFlag');
const sfxWin   = $('#sfxWin');
const sfxLose  = $('#sfxLose');
const sfxBoom  = $('#sfxBoom');
const volumeEl    = $('#volume');
const btnMusicToggle = $('#btnMusicToggle');
const btnReset    = $('#btnReset');
const btnSfxToggle = $('#btnSfxToggle');
const sfxVolumeEl  = $('#sfxVolume');

/* ---------- TIỆN ÍCH ---------- */
const fmtTime = (s) => {
  const m = String(Math.floor(s / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${m}:${sec}`;
};

const getMineSrc = () => MINE_STYLES.find(m => m.id === state.mineStyle)?.src || MINE_STYLES[0].src;
const getFlagSrc = () => FLAG_STYLES.find(f => f.id === state.flagStyle)?.src || FLAG_STYLES[0].src;

/* ---------- LƯU / ĐỌC CÀI ĐẶT ---------- */
function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      level: state.level,
      mineStyle: state.mineStyle,
      flagStyle: state.flagStyle,
      bgStyle: state.bgStyle,
      volume: state.volume,
      musicOn: state.musicOn,
      sfxOn: state.sfxOn,
      sfxVolume: state.sfxVolume,
    }));
  } catch (e) { /* ignore */ }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (s.level) state.level = s.level;
    if (s.mineStyle) state.mineStyle = s.mineStyle;
    if (s.flagStyle) state.flagStyle = s.flagStyle;
    if (s.bgStyle) state.bgStyle = s.bgStyle;
    if (typeof s.volume === 'number') state.volume = s.volume;
    if (typeof s.musicOn === 'boolean') state.musicOn = s.musicOn;
    if (typeof s.sfxOn === 'boolean') state.sfxOn = s.sfxOn;
    if (typeof s.sfxVolume === 'number') state.sfxVolume = s.sfxVolume;
  } catch (e) { /* ignore */ }
}

/* ---------- ÁP DỤNG GIAO DIỆN ---------- */
function applyBackground() {
  const bg = BG_STYLES.find(b => b.id === state.bgStyle);
  if (bg && bg.src) {
    document.body.classList.add('has-bg');
    document.body.style.backgroundImage = `url("${bg.src}")`;
  } else {
    document.body.classList.remove('has-bg');
    document.body.style.backgroundImage = '';
  }
}

function applyMusicState() {
  bgm.volume = state.volume;
  btnMusic.textContent = state.musicOn ? '🔊' : '🔇';
  btnMusicToggle.textContent = state.musicOn ? 'Tắt nhạc' : 'Bật nhạc';
  btnMusicToggle.classList.toggle('btn-primary', state.musicOn);
  if (state.musicOn) {
    bgm.play().catch(() => {});
  } else {
    bgm.pause();
  }
}

function applySfxState() {
  btnSfxToggle.textContent = state.sfxOn ? 'Tắt SFX' : 'Bật SFX';
  btnSfxToggle.classList.toggle('btn-primary', state.sfxOn);
  sfxVolumeEl.value = state.sfxVolume;
  sfxVolumeEl.disabled = !state.sfxOn;
}

function renderSwatches() {
  // mines
  mineSwatches.innerHTML = '';
  MINE_STYLES.forEach(m => {
    const el = document.createElement('button');
    el.className = 'swatch' + (state.mineStyle === m.id ? ' active' : '');
    el.innerHTML = `<img src="${m.src}" alt="${m.label}" /><span class="label">${m.label}</span>`;
    el.onclick = () => { state.mineStyle = m.id; renderSwatches(); saveSettings(); };
    mineSwatches.appendChild(el);
  });

  // flags
  flagSwatches.innerHTML = '';
  FLAG_STYLES.forEach(f => {
    const el = document.createElement('button');
    el.className = 'swatch' + (state.flagStyle === f.id ? ' active' : '');
    el.innerHTML = `<img src="${f.src}" alt="${f.label}" /><span class="label">${f.label}</span>`;
    el.onclick = () => { state.flagStyle = f.id; renderSwatches(); saveSettings(); };
    flagSwatches.appendChild(el);
  });

  // backgrounds
  bgSwatches.innerHTML = '';
  BG_STYLES.forEach(b => {
    const el = document.createElement('button');
    el.className = 'swatch bg-swatch' + (state.bgStyle === b.id ? ' active' : '');
    if (b.src) {
      el.innerHTML = `<div class="bg-preview" style="background-image:url('${b.src}')"></div><span class="label">${b.label}</span>`;
    } else {
      el.innerHTML = `<div class="bg-preview" style="background:var(--panel-2)"></div><span class="label">${b.label}</span>`;
    }
    el.onclick = () => { state.bgStyle = b.id; applyBackground(); renderSwatches(); saveSettings(); };
    bgSwatches.appendChild(el);
  });
}

function renderLevelSeg() {
  [...levelSeg.querySelectorAll('button')].forEach(b => {
    b.classList.toggle('active', b.dataset.level === state.level);
  });
}

/* ---------- SOUND EFFECTS ---------- */
function playSfx(audioEl, { volume = state.sfxVolume, rate = 1 } = {}) {
  if (!state.sfxOn || !audioEl) return;
  try {
    // Tối ưu: Reset thời gian phát thay vì clone
    audioEl.currentTime = 0;
    audioEl.volume = Math.min(1, Math.max(0, volume));
    audioEl.playbackRate = rate;
    const p = audioEl.play();
    if (p && p.catch) p.catch(() => {});
  } catch (e) { /* ignore */ }
}

/* ---------- KHỞI TẠO VÁN ---------- */
function initGame() {
  const cfg = LEVELS[state.level];
  state.size = cfg.size;
  state.mines = cfg.mines;
  state.board = [];
  state.started = false;
  state.over = false;
  state.flags = 0;
  state.openedSafe = 0;

  clearInterval(state.timerId);
  state.timer = 0;
  timerEl.textContent = '00:00';
  mineCountEl.textContent = state.mines;

  boardEl.innerHTML = '';
  boardEl.dataset.level = state.level;
  boardEl.style.gridTemplateColumns = `repeat(${state.size}, var(--cell-size))`;

  for (let r = 0; r < state.size; r++) {
    for (let c = 0; c < state.size; c++) {
      state.board.push({ r, c, mine: false, open: false, flag: false, adj: 0 });
    }
  }

  renderBoard();
  overlay.classList.add('hidden');
  closePanel();
}

function idx(r, c) { return r * state.size + c; }

function neighbors(r, c) {
  const out = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < state.size && nc >= 0 && nc < state.size) out.push([nr, nc]);
    }
  }
  return out;
}

/* ---------- RẢI MÌN (sau click đầu) ---------- */
function placeMines(safeR, safeC) {
  const safeSet = new Set();
  safeSet.add(idx(safeR, safeC));
  neighbors(safeR, safeC).forEach(([r, c]) => safeSet.add(idx(r, c)));

  let placed = 0;
  while (placed < state.mines) {
    const r = Math.floor(Math.random() * state.size);
    const c = Math.floor(Math.random() * state.size);
    const i = idx(r, c);
    if (state.board[i].mine || safeSet.has(i)) continue;
    state.board[i].mine = true;
    placed++;
  }

  // tính adj
  for (const cell of state.board) {
    if (cell.mine) continue;
    cell.adj = neighbors(cell.r, cell.c)
      .filter(([r, c]) => state.board[idx(r, c)].mine).length;
  }
}

/* ---------- RENDER ---------- */
function renderBoard() {
  boardEl.innerHTML = '';
  const mineSrc = getMineSrc();
  const flagSrc = getFlagSrc();

  for (const cell of state.board) {
    const el = document.createElement('div');
    el.className = 'cell';
    el.dataset.i = idx(cell.r, cell.c);

    if (cell.open) {
      el.classList.add('open');
      if (cell.mine) {
        el.classList.add('mine-hit');
        el.innerHTML = `<img src="${mineSrc}" alt="mìn" />`;
      } else if (cell.adj > 0) {
        el.textContent = cell.adj;
        el.classList.add('n' + cell.adj);
      }
    } else if (cell.flag) {
      el.classList.add('flag');
      el.innerHTML = `<img src="${flagSrc}" alt="cờ" />`;
    }

    el.addEventListener('click', onCellClick);
    el.addEventListener('contextmenu', onCellContext);
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);

    boardEl.appendChild(el);
  }
}

/* ---------- TƯƠNG TÁC ---------- */
let longPressTimer = null;
let longPressTriggered = false;
let pointerStart = null;

function onPointerDown(e) {
  if (e.pointerType === 'mouse') return;
  longPressTriggered = false;
  pointerStart = { x: e.clientX, y: e.clientY, id: e.pointerId };
  longPressTimer = setTimeout(() => {
    longPressTriggered = true;
    const i = +e.currentTarget.dataset.i;
    handleRightClick(i);
    if (navigator.vibrate) navigator.vibrate(30);
  }, 400);
}

function onPointerUp(e) {
  if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
  pointerStart = null;
}

function onCellClick(e) {
  if (longPressTriggered) { longPressTriggered = false; return; }
  const i = +e.currentTarget.dataset.i;
  if (state.over) return;

  if (state.flagMode) {
    handleRightClick(i);
  } else {
    handleLeftClick(i);
  }
}

function onCellContext(e) {
  e.preventDefault();
  if (state.over) return;
  const i = +e.currentTarget.dataset.i;
  handleRightClick(i);
}

/* ---------- XỬ LÝ ---------- */
function handleLeftClick(i) {
  const cell = state.board[i];
  if (cell.open || cell.flag) return;

  if (!state.started) {
    state.started = true;
    placeMines(cell.r, cell.c);
    startTimer();
  }

  if (cell.mine) {
    cell.open = true;
    playSfx(sfxBoom, { rate: 0.9 });
    loseGame();
    return;
  }

  playSfx(sfxClick, { rate: 0.95 + Math.random() * 0.1 });   // ← thêm
  floodOpen(i);
  renderBoard();
  checkWin();
}

function handleRightClick(i) {
  const cell = state.board[i];
  if (cell.open) return;
  if (!cell.flag && state.flags >= state.mines) return;

  cell.flag = !cell.flag;
  state.flags += cell.flag ? 1 : -1;
  mineCountEl.textContent = state.mines - state.flags;
  updateCellEl(i);

  playSfx(sfxFlag, { rate: cell.flag ? 1.05 : 0.9 });   // ← thêm
}

function floodOpen(startI) {
  const stack = [startI];
  while (stack.length) {
    const i = stack.pop();
    const cell = state.board[i];
    if (cell.open || cell.flag || cell.mine) continue;
    cell.open = true;
    state.openedSafe++;

    if (cell.adj === 0) {
      for (const [r, c] of neighbors(cell.r, cell.c)) {
        const ni = idx(r, c);
        if (!state.board[ni].open && !state.board[ni].flag && !state.board[ni].mine) {
          stack.push(ni);
        }
      }
    }
  }
}

function updateCellEl(i) {
  const cell = state.board[i];
  const el = boardEl.children[i];
  if (!el) return;
  const mineSrc = getMineSrc();
  const flagSrc = getFlagSrc();
  el.className = 'cell';
  el.innerHTML = '';
  if (cell.open) {
    el.classList.add('open');
    if (cell.mine) {
      el.classList.add('mine-hit');
      el.innerHTML = `<img src="${mineSrc}" alt="mìn" />`;
    } else if (cell.adj > 0) {
      el.textContent = cell.adj;
      el.classList.add('n' + cell.adj);
    }
  } else if (cell.flag) {
    el.classList.add('flag');
    el.innerHTML = `<img src="${flagSrc}" alt="cờ" />`;
  }
}

/* ---------- TIMER ---------- */
function startTimer() {
  clearInterval(state.timerId);
  state.timerId = setInterval(() => {
    state.timer++;
    timerEl.textContent = fmtTime(state.timer);
  }, 1000);
}

/* ---------- THẮNG / THUA ---------- */
function checkWin() {
  const totalSafe = state.size * state.size - state.mines;
  if (state.openedSafe >= totalSafe) winGame();
}

function winGame() {
  state.over = true;
  clearInterval(state.timerId);
  playSfx(sfxWin, { volume: 1 });        // ← thêm
  // đánh dấu tất cả mìn bằng cờ
  const flagSrc = getFlagSrc();
  for (const cell of state.board) {
    if (cell.mine && !cell.flag) {
      cell.flag = true;
      state.flags++;
    }
  }
  mineCountEl.textContent = 0;
  renderBoard();
  overlayEmoji.textContent = '🎉';
  overlayTitle.textContent = 'Bạn thắng!';
  overlayText.textContent = `Thời gian: ${fmtTime(state.timer)} — Độ khó: ${levelName(state.level)}`;
  overlay.classList.remove('hidden');
}

function loseGame() {
  state.over = true;
  clearInterval(state.timerId);
  playSfx(sfxLose, { volume: 1 });       // ← thêm
  // mở tất cả mìn
  for (const cell of state.board) {
    if (cell.mine) cell.open = true;
  }
  renderBoard();
  overlayEmoji.textContent = '💥';
  overlayTitle.textContent = 'Bạn thua!';
  overlayText.textContent = `Đã nổ mìn. Thời gian: ${fmtTime(state.timer)}`;
  overlay.classList.remove('hidden');
}

function levelName(lv) {
  return { easy: 'Dễ', medium: 'Vừa', hard: 'Khó' }[lv] || lv;
}

/* ---------- PANEL ---------- */
function openPanel() {
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  panelBackdrop.classList.remove('hidden');
  renderSwatches();
  renderLevelSeg();
  applySfxState();
  volumeEl.value = state.volume;
}
function closePanel() {
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
  panelBackdrop.classList.add('hidden');
}

/* ---------- SỰ KIỆN ---------- */
btnNew.addEventListener('click', initGame);
btnPlayAgain.addEventListener('click', initGame);

btnFlagMode.addEventListener('click', () => {
  state.flagMode = !state.flagMode;
  btnFlagMode.classList.toggle('active', state.flagMode);
});

btnMusic.addEventListener('click', () => {
  state.musicOn = !state.musicOn;
  applyMusicState();
  saveSettings();
});

btnSfxToggle.addEventListener('click', () => {
  state.sfxOn = !state.sfxOn;
  applySfxState();
  saveSettings();
  if (state.sfxOn) playSfx(sfxClick, { volume: state.sfxVolume });
});

sfxVolumeEl.addEventListener('input', () => {
  state.sfxVolume = +sfxVolumeEl.value;
  saveSettings();
});

btnSettings.addEventListener('click', openPanel);
btnClosePanel.addEventListener('click', closePanel);
panelBackdrop.addEventListener('click', closePanel);

levelSeg.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-level]');
  if (!btn) return;
  state.level = btn.dataset.level;
  renderLevelSeg();
  saveSettings();
  initGame();
});

volumeEl.addEventListener('input', () => {
  state.volume = +volumeEl.value;
  bgm.volume = state.volume;
  saveSettings();
});

btnMusicToggle.addEventListener('click', () => {
  state.musicOn = !state.musicOn;
  applyMusicState();
  saveSettings();
});

btnReset.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  state.level = 'easy';
  state.mineStyle = 'mine1';
  state.flagStyle = 'flag1';
  state.bgStyle = 'none';
  state.volume = 0.4;
  state.musicOn = false;
  state.sfxOn = true;
  state.sfxVolume = 0.7;
  applySfxState();
  applyBackground();
  applyMusicState();
  renderSwatches();
  renderLevelSeg();
  initGame();
});

/* Phím tắt */
document.addEventListener('keydown', (e) => {
  if (e.key === 'f' || e.key === 'F') {
    state.flagMode = !state.flagMode;
    btnFlagMode.classList.toggle('active', state.flagMode);
  }
  if (e.key === 'Escape') closePanel();
});

/* ---------- KHỞI ĐỘNG ---------- */
function boot() {
  loadSettings();
  bgm.src = 'assets/audio/bgm.mp3';
  applyBackground();
  applyMusicState();
  // không cần set trực tiếp, playSfx đọc từ state.sfxVolume
  // Trình duyệt chặn autoplay: chỉ phát nhạc sau lần chạm đầu tiên
  const unlockAudio = () => {
    if (state.musicOn && bgm.paused) {
      bgm.play().catch(() => {});
    }
    document.removeEventListener('pointerdown', unlockAudio);
    document.removeEventListener('keydown', unlockAudio);
  };
  document.addEventListener('pointerdown', unlockAudio, { once: false });
  document.addEventListener('keydown', unlockAudio, { once: false });
  renderLevelSeg();
  renderSwatches();
  volumeEl.value = state.volume;
  initGame();
  applySfxState();
}

boot();