const currentPage = window.location.pathname.split("/").pop() || "index.html";
const navLinks = document.querySelectorAll(".nav-links a");

navLinks.forEach((link) => {
  const linkPage = link.getAttribute("href");

  if (linkPage === currentPage) {
    link.classList.add("active");
  }
});

const yearElement = document.getElementById("year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

const guessInput = document.getElementById("guess-input");
const guessButton = document.getElementById("guess-button");
const guessReset = document.getElementById("guess-reset");
const guessMessage = document.getElementById("guess-message");
const guessAttempts = document.getElementById("guess-attempts");

if (guessInput && guessButton && guessReset && guessMessage && guessAttempts) {
  let secretNumber = randomNumber(1, 10000);
  let attempts = 0;

  const resetGuessGame = () => {
    secretNumber = randomNumber(1, 10000);
    attempts = 0;
    guessInput.value = "";
    guessMessage.textContent = "Start by entering a number.";
    guessAttempts.textContent = "Attempts: 0";
  };

  guessButton.addEventListener("click", () => {
    const guess = Number(guessInput.value);

    if (!guess || guess < 1 || guess > 10000) {
      guessMessage.textContent = "Enter a whole number from 1 to 10000.";
      return;
    }

    attempts += 1;
    guessAttempts.textContent = `Attempts: ${attempts}`;

    if (guess === secretNumber) {
      guessMessage.textContent = `Correct. The number was ${secretNumber}.`;
      return;
    }

    if (guess < secretNumber) {
      guessMessage.textContent = "Too low. Try a biggerrrrrrrrrrr number.";
      return;
    }

    guessMessage.textContent = "Too high. Try a smallerrrrrr number.";
  });

  guessReset.addEventListener("click", resetGuessGame);
  guessInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      guessButton.click();
    }
  });
}

const mathQuestion = document.getElementById("math-question");
const mathInput = document.getElementById("math-input");
const mathButton = document.getElementById("math-button");
const mathNext = document.getElementById("math-next");
const mathMessage = document.getElementById("math-message");
const mathScore = document.getElementById("math-score");

if (mathQuestion && mathInput && mathButton && mathNext && mathMessage && mathScore) {
  let correctAnswer = 0;
  let correctCount = 0;

  const createMathQuestion = (message = "Solve the question above.") => {
    const useAddition = Math.random() < 0.5;
    const firstNumber = randomNumber(0, 100);
    const secondNumber = randomNumber(0, 100);

    if (useAddition) {
      correctAnswer = firstNumber + secondNumber;
      mathQuestion.textContent = `${firstNumber} + ${secondNumber} = ?`;
    } else {
      const bigger = Math.max(firstNumber, secondNumber);
      const smaller = Math.min(firstNumber, secondNumber);
      correctAnswer = bigger - smaller;
      mathQuestion.textContent = `${bigger} - ${smaller} = ?`;
    }

    mathInput.value = "";
    mathMessage.textContent = message;
  };

  mathButton.addEventListener("click", () => {
    const answer = Number(mathInput.value);

    if (mathInput.value === "") {
      mathMessage.textContent = "Enter an answer first.";
      return;
    }

    if (answer === correctAnswer) {
      correctCount += 1;
      mathScore.textContent = `Score: ${correctCount} correct`;
      createMathQuestion("Chinh xac!!! Cau hoi tiep theo.");
      return;
    }

    mathMessage.textContent = `Sai rui, dap an dung laaaa: ${correctAnswer}.`;
  });

  mathNext.addEventListener("click", createMathQuestion);
  mathInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      mathButton.click();
    }
  });
  createMathQuestion();
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
