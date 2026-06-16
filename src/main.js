import { heroes } from "./heroes.js";
import { boardSize, boardFromMatrix, collapseBoard, createBoard, findMatches, isAdjacent, removeMatches, swap } from "./game.js";

const pool = heroes.slice(0, 8);
const targetHero = heroes.find((hero) => hero.ename === "111");
const els = {
  board: document.querySelector("[data-board]"),
  score: document.querySelector("[data-score]"),
  moves: document.querySelector("[data-moves]"),
  combo: document.querySelector("[data-combo]"),
  status: document.querySelector("[data-status]"),
  toast: document.querySelector("[data-toast]"),
  targetImg: document.querySelector("[data-target-img]"),
  targetName: document.querySelector("[data-target-name]"),
  targetLeft: document.querySelector("[data-target-left]"),
  log: document.querySelector("[data-log]")
};

const state = {
  board: createBoard(pool),
  score: 0,
  moves: 30,
  combo: 0,
  selected: null,
  busy: false,
  matchedKeys: new Set(),
  hintKeys: new Set(),
  targetLeft: 18
};

function render() {
  els.board.innerHTML = "";
  state.board.flat().forEach((hero, index) => {
    const row = Math.floor(index / boardSize);
    const col = index % boardSize;
    const tile = document.createElement("button");
    tile.className = "tile";
    tile.type = "button";
    tile.dataset.row = row;
    tile.dataset.col = col;
    tile.dataset.hero = hero.ename;
    tile.setAttribute("aria-label", `${hero.cname}，${hero.title}，${hero.role}，第${row + 1}行第${col + 1}列`);
    if (state.selected?.row === row && state.selected?.col === col) tile.classList.add("is-selected");
    if (state.matchedKeys.has(`${row}-${col}`)) tile.classList.add("is-matched");
    if (state.hintKeys.has(`${row}-${col}`)) tile.classList.add("is-hint");
    tile.innerHTML = `
      <img src="${hero.avatar}" alt="${hero.cname}" draggable="false" />
      <span class="tile-role">${hero.role}</span>
      <span class="tile-name">${hero.cname}</span>
    `;
    tile.addEventListener("pointerdown", onPointerDown);
    tile.addEventListener("pointerenter", onPointerEnter);
    tile.addEventListener("pointerup", onPointerUp);
    tile.addEventListener("dragstart", (event) => event.preventDefault());
    els.board.appendChild(tile);
  });
  els.score.textContent = state.score.toLocaleString("zh-CN");
  els.moves.textContent = state.moves;
  els.combo.textContent = state.combo;
  els.targetImg.src = targetHero.avatar;
  els.targetImg.alt = targetHero.cname;
  els.targetName.textContent = `${targetHero.cname} · ${targetHero.title}`;
  els.targetLeft.textContent = state.targetLeft;
}

function getTile(event) {
  const tile = event.target.closest(".tile");
  if (!tile) return null;
  return { row: Number(tile.dataset.row), col: Number(tile.dataset.col), tile };
}

function onPointerDown(event) {
  if (state.busy) return;
  const tile = getTile(event);
  if (!tile) return;
  state.selected = { row: tile.row, col: tile.col };
  state.hintKeys.clear();
  tile.tile.setPointerCapture?.(event.pointerId);
  render();
}

function onPointerEnter(event) {
  if (!state.selected || state.busy) return;
  const tile = getTile(event);
  state.hintKeys.clear();
  if (tile && isAdjacent(state.selected, tile)) {
    state.hintKeys.add(`${tile.row}-${tile.col}`);
  }
  render();
}

async function onPointerUp(event) {
  if (!state.selected || state.busy) return;
  const origin = state.selected;
  const target = getTile(event);
  state.selected = null;
  state.hintKeys.clear();
  if (!target || !isAdjacent(origin, target)) {
    render();
    return;
  }
  await trySwap(origin, target);
}

async function trySwap(origin, target) {
  if (state.moves <= 0) {
    writeLog("步数已用完，请重新开始。");
    return false;
  }

  state.busy = true;
  let nextBoard = swap(state.board, origin, target);
  let matches = findMatches(nextBoard);
  if (!matches.length) {
    state.board = state.board;
    state.busy = false;
    writeStatus("无效交换");
    writeLog("没有形成三连，英雄已回到原位。");
    render();
    return false;
  }

  state.board = nextBoard;
  state.moves -= 1;
  state.combo = 0;
  render();
  await resolveMatches(matches);
  state.busy = false;
  return true;
}

async function resolveMatches(matches) {
  while (matches.length) {
    state.combo += 1;
    state.matchedKeys = new Set(matches.map((item) => item.key));
    state.score += matches.length * 100 * state.combo;
    state.targetLeft = Math.max(0, state.targetLeft - matches.filter((item) => state.board[item.row][item.col].ename === targetHero.ename).length);
    writeStatus(`消除 ${matches.length} 个`);
    showToast(state.combo > 1 ? `Combo x${state.combo}` : `消除 +${matches.length}`);
    render();
    await wait(240);
    state.board = collapseBoard(removeMatches(state.board, matches), pool);
    state.matchedKeys.clear();
    render();
    writeLog(`<strong>消除 ${matches.length} 个英雄</strong>，连消 x${state.combo}，得分 +${matches.length * 100 * state.combo}`);
    await wait(170);
    matches = findMatches(state.board);
  }
  if (state.targetLeft === 0) {
    writeStatus("任务完成");
    writeLog("<strong>任务完成！</strong> 指定英雄头像已收集完毕。");
  }
}

function showHint() {
  state.hintKeys.clear();
  for (let row = 0; row < boardSize; row += 1) {
    for (let col = 0; col < boardSize; col += 1) {
      const candidates = [{ row: row + 1, col }, { row, col: col + 1 }].filter((item) => item.row < boardSize && item.col < boardSize);
      for (const next of candidates) {
        if (findMatches(swap(state.board, { row, col }, next)).length) {
          state.hintKeys.add(`${row}-${col}`);
          state.hintKeys.add(`${next.row}-${next.col}`);
          writeStatus("已标出可交换");
          writeLog("发现金色高亮的一组可消除交换。");
          render();
          return;
        }
      }
    }
  }
  writeLog("当前棋盘无可用交换，建议重排。");
}

function shuffleBoard() {
  if (state.busy || state.moves <= 0) return;
  state.board = createBoard(pool);
  state.moves -= 1;
  state.combo = 0;
  state.hintKeys.clear();
  writeStatus("棋盘已重排");
  writeLog("已重排棋盘，消耗 1 步。");
  render();
}

async function blastCenter() {
  if (state.busy) return;
  const center = state.board[3][3];
  const matches = [];
  state.board.forEach((row, rowIndex) => {
    row.forEach((hero, colIndex) => {
      if (hero.ename === center.ename) matches.push({ row: rowIndex, col: colIndex, key: `${rowIndex}-${colIndex}` });
    });
  });
  state.busy = true;
  await resolveMatches(matches);
  state.busy = false;
}

function restart() {
  state.board = createBoard(pool);
  state.score = 0;
  state.moves = 30;
  state.combo = 0;
  state.selected = null;
  state.busy = false;
  state.matchedKeys.clear();
  state.hintKeys.clear();
  state.targetLeft = 18;
  writeStatus("准备开始");
  writeLog("游戏已开始。拖动相邻英雄头像完成交换。");
  render();
}

function writeStatus(text) {
  els.status.textContent = text;
}

function writeLog(html) {
  els.log.innerHTML = html;
}

function showToast(text) {
  els.toast.textContent = text;
  els.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => els.toast.classList.remove("is-visible"), 720);
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.action;
    if (action === "restart") restart();
    if (action === "hint") showHint();
    if (action === "shuffle") shuffleBoard();
    if (action === "blast") blastCenter();
  });
});

window.__kingMatch3 = {
  state,
  findMatches: () => findMatches(state.board),
  trySwap,
  restart,
  setBoard(matrix) {
    state.board = boardFromMatrix(matrix, heroes);
    state.matchedKeys.clear();
    state.hintKeys.clear();
    render();
  }
};

restart();
