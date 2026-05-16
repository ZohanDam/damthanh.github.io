const memoryBoard = document.getElementById("memory-board");
const memoryMoves = document.getElementById("memory-moves");
const memoryMessage = document.getElementById("memory-message");
const memoryRestart = document.getElementById("memory-restart");
const memoryFullscreen = document.getElementById("memory-fullscreen");
const memoryThemeControls = document.getElementById("memory-theme-controls");
const memoryDifficultyControls = document.getElementById("memory-difficulty-controls");

if (
  memoryBoard &&
  memoryMoves &&
  memoryMessage &&
  memoryRestart &&
  memoryThemeControls &&
  memoryDifficultyControls
) {
  const cp = (...codes) => String.fromCodePoint(...codes);
  const memoryThemes = {
    animals: [
      cp(0x1f436), cp(0x1f431), cp(0x1f42d), cp(0x1f439),
      cp(0x1f430), cp(0x1f98a), cp(0x1f43b), cp(0x1f43c),
      cp(0x1f438), cp(0x1f435), cp(0x1f428), cp(0x1f981),
      cp(0x1f42f), cp(0x1f42e), cp(0x1f437), cp(0x1f414),
    ],
    shapes: [
      cp(0x2b50), cp(0x2728), cp(0x1f4a0), cp(0x1f53a),
      cp(0x1f53b), cp(0x1f537), cp(0x1f536), cp(0x1f539),
      cp(0x1f538), cp(0x2b1b), cp(0x2b1c), cp(0x1f90d),
      cp(0x1f49b), cp(0x1f49a), cp(0x1f49c), cp(0x1f9e1),
    ],
    numbers: [
      cp(0x30, 0xfe0f, 0x20e3), cp(0x31, 0xfe0f, 0x20e3),
      cp(0x32, 0xfe0f, 0x20e3), cp(0x33, 0xfe0f, 0x20e3),
      cp(0x34, 0xfe0f, 0x20e3), cp(0x35, 0xfe0f, 0x20e3),
      cp(0x36, 0xfe0f, 0x20e3), cp(0x37, 0xfe0f, 0x20e3),
      cp(0x38, 0xfe0f, 0x20e3), cp(0x39, 0xfe0f, 0x20e3),
      cp(0x2460), cp(0x2461), cp(0x2462), cp(0x2463),
      cp(0x2464), cp(0x2465),
    ],
    colors: [
      cp(0x1f534), cp(0x1f535), cp(0x1f7e2), cp(0x1f7e1),
      cp(0x1f7e3), cp(0x1f7e0), cp(0x26ab), cp(0x26aa),
      cp(0x1f7e5), cp(0x1f7e6), cp(0x1f7e9), cp(0x1f7e8),
      cp(0x1f7ea), cp(0x1f7eb), cp(0x1fa77), cp(0x1fa75),
    ],
  };

  const difficultyPairs = {
    hard: 8,
    "very-hard": 16,
  };

  let currentTheme = "animals";
  let currentDifficulty = "hard";
  let openCards = [];
  let matchedPairs = 0;
  let moves = 0;
  let boardLocked = false;

  const setActiveChip = (container, selector, value) => {
    container.querySelectorAll(selector).forEach((button) => {
      const chipValue = button.dataset.theme || button.dataset.difficulty;
      button.classList.toggle("is-active", chipValue === value);
    });
  };

  const updateMoves = () => {
    memoryMoves.textContent = String(moves);
  };

  const applyBoardLayout = () => {
    const totalCards = difficultyPairs[currentDifficulty] * 2;
    const mobileLayout = window.matchMedia("(max-width: 700px)").matches;
    let columns = 4;
    let rows = 4;

    if (totalCards === 32) {
      columns = mobileLayout ? 4 : 8;
      rows = mobileLayout ? 8 : 4;
    }

    memoryBoard.style.setProperty("--memory-columns", columns);
    memoryBoard.style.setProperty("--memory-rows", rows);
  };

  const shuffleCards = (items) => {
    const copy = [...items];

    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }

    return copy;
  };

  const buildBoard = () => {
    const pairCount = difficultyPairs[currentDifficulty];
    const selectedIcons = memoryThemes[currentTheme].slice(0, pairCount);
    const cards = shuffleCards(
      selectedIcons.flatMap((icon, index) => [
        { id: `${currentTheme}-${index}-a`, icon },
        { id: `${currentTheme}-${index}-b`, icon },
      ])
    );

    memoryBoard.innerHTML = "";
    applyBoardLayout();
    memoryBoard.classList.toggle("is-large", currentDifficulty === "very-hard");

    cards.forEach((cardData) => {
      const card = document.createElement("button");
      const inner = document.createElement("span");
      const front = document.createElement("span");
      const back = document.createElement("span");

      card.type = "button";
      card.className = "memory-card";
      card.dataset.icon = cardData.icon;
      card.dataset.id = cardData.id;
      card.setAttribute("aria-label", "Memory card");

      inner.className = "memory-card-inner";
      front.className = "memory-face memory-face-front";
      back.className = "memory-face memory-face-back";

      front.textContent = "?";
      back.textContent = cardData.icon;

      inner.append(front, back);
      card.append(inner);
      memoryBoard.append(card);
    });
  };

  const resetMemoryGame = (message = "Find all matching pairs.") => {
    openCards = [];
    matchedPairs = 0;
    moves = 0;
    boardLocked = false;
    updateMoves();
    memoryMessage.textContent = message;
    buildBoard();
  };

  const finishTurn = (firstCard, secondCard, isMatch) => {
    if (isMatch) {
      firstCard.classList.add("is-matched");
      secondCard.classList.add("is-matched");
      openCards = [];
      boardLocked = false;
      matchedPairs += 1;

      if (matchedPairs === difficultyPairs[currentDifficulty]) {
        memoryMessage.textContent = `You won in ${moves} moves.`;
      } else {
        memoryMessage.textContent = "Match found. Keep going.";
      }

      return;
    }

    memoryMessage.textContent = "Not a match. Try again.";

    window.setTimeout(() => {
      firstCard.classList.remove("is-flipped");
      secondCard.classList.remove("is-flipped");
      openCards = [];
      boardLocked = false;
    }, 700);
  };

  memoryBoard.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const card = target ? target.closest(".memory-card") : null;

    if (!card || boardLocked) {
      return;
    }

    if (card.classList.contains("is-flipped") || card.classList.contains("is-matched")) {
      return;
    }

    card.classList.add("is-flipped");
    openCards.push(card);

    if (openCards.length === 2) {
      boardLocked = true;
      moves += 1;
      updateMoves();

      const [firstCard, secondCard] = openCards;
      finishTurn(firstCard, secondCard, firstCard.dataset.icon === secondCard.dataset.icon);
    }
  });

  memoryThemeControls.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target ? target.closest("[data-theme]") : null;

    if (!button || button.dataset.theme === currentTheme) {
      return;
    }

    currentTheme = button.dataset.theme;
    setActiveChip(memoryThemeControls, "[data-theme]", currentTheme);
    resetMemoryGame(`Mode changed to ${button.textContent}.`);
  });

  memoryDifficultyControls.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target ? target.closest("[data-difficulty]") : null;

    if (!button || button.dataset.difficulty === currentDifficulty) {
      return;
    }

    currentDifficulty = button.dataset.difficulty;
    setActiveChip(memoryDifficultyControls, "[data-difficulty]", currentDifficulty);
    resetMemoryGame(`Difficulty changed to ${button.textContent}.`);
  });

  memoryRestart.addEventListener("click", () => {
    resetMemoryGame("Game restarted.");
  });

  if (memoryFullscreen) {
    memoryFullscreen.addEventListener("click", async () => {
      const container = document.documentElement;

      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
          memoryFullscreen.textContent = "Full Screen";
        } else {
          await container.requestFullscreen();
          memoryFullscreen.textContent = "Exit Full Screen";
        }
      } catch {
        memoryMessage.textContent = "Full screen is not available in this browser.";
      }
    });

    document.addEventListener("fullscreenchange", () => {
      memoryFullscreen.textContent = document.fullscreenElement ? "Exit Full Screen" : "Full Screen";
    });
  }

  window.addEventListener("resize", () => {
    applyBoardLayout();
  });

  resetMemoryGame();
}
