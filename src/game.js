export const boardSize = 7;

export function cloneHero(hero) {
  return { ...hero, uid: `${hero.ename}-${Math.random().toString(36).slice(2)}` };
}

export function createBoard(pool) {
  const board = Array.from({ length: boardSize }, () => Array.from({ length: boardSize }, () => null));
  for (let row = 0; row < boardSize; row += 1) {
    for (let col = 0; col < boardSize; col += 1) {
      let hero = randomHero(pool);
      while (wouldCreateInitialMatch(board, hero, row, col)) {
        hero = randomHero(pool);
      }
      board[row][col] = cloneHero(hero);
    }
  }
  return board;
}

export function randomHero(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

function wouldCreateInitialMatch(board, hero, row, col) {
  const horizontal = col >= 2 && board[row][col - 1]?.ename === hero.ename && board[row][col - 2]?.ename === hero.ename;
  const vertical = row >= 2 && board[row - 1][col]?.ename === hero.ename && board[row - 2][col]?.ename === hero.ename;
  return horizontal || vertical;
}

export function isAdjacent(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

export function swap(board, a, b) {
  const next = board.map((row) => row.slice());
  const temp = next[a.row][a.col];
  next[a.row][a.col] = next[b.row][b.col];
  next[b.row][b.col] = temp;
  return next;
}

export function findMatches(board) {
  const matched = new Map();
  for (let row = 0; row < boardSize; row += 1) {
    let streak = [coord(row, 0)];
    for (let col = 1; col < boardSize; col += 1) {
      if (board[row][col].ename === board[row][col - 1].ename) {
        streak.push(coord(row, col));
      } else {
        collect(streak, matched);
        streak = [coord(row, col)];
      }
    }
    collect(streak, matched);
  }

  for (let col = 0; col < boardSize; col += 1) {
    let streak = [coord(0, col)];
    for (let row = 1; row < boardSize; row += 1) {
      if (board[row][col].ename === board[row - 1][col].ename) {
        streak.push(coord(row, col));
      } else {
        collect(streak, matched);
        streak = [coord(row, col)];
      }
    }
    collect(streak, matched);
  }
  return [...matched.values()];
}

export function removeMatches(board, matches) {
  const next = board.map((row) => row.slice());
  matches.forEach(({ row, col }) => {
    next[row][col] = null;
  });
  return next;
}

export function collapseBoard(board, pool) {
  const next = board.map((row) => row.slice());
  for (let col = 0; col < boardSize; col += 1) {
    const survivors = [];
    for (let row = boardSize - 1; row >= 0; row -= 1) {
      if (next[row][col]) survivors.push(next[row][col]);
    }
    for (let row = boardSize - 1; row >= 0; row -= 1) {
      next[row][col] = survivors.shift() || cloneHero(randomHero(pool));
    }
  }
  return next;
}

export function coord(row, col) {
  return { row, col, key: `${row}-${col}` };
}

function collect(streak, matched) {
  if (streak.length < 3) return;
  streak.forEach((item) => matched.set(item.key, item));
}

export function boardFromMatrix(matrix, allHeroes) {
  return matrix.map((row) => row.map((ename) => cloneHero(allHeroes.find((hero) => hero.ename === String(ename)) || allHeroes[0])));
}
