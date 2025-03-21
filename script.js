const letterCirclesContainer = document.querySelector('.letter-circles');
const questionElement = document.querySelector('.question');
const answerInput = document.getElementById('answer-input')
const startButton = document.getElementById('start-button');
const skipButton = document.getElementById('skip-button');
const timerElement = document.querySelector('.timer');
const skipsElement = document.querySelector('.skips');
const leaderboardTable = document.getElementById('leaderboard-table');

let alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
let letterElements = [];
let currentLetterIndex = 0;
let gameActive = false;
let startTime = 0;
let totalTime = 0;
let timerInterval;
let skipsRemaining=3
let questionsDatabase = {};
let currentQuestion = '';

function initializeQuestions() {
    questionsDatabase = {
        'A':[

        ],
        'B':[

        ],
        'C':[

        ],
        'D':[

        ],
        'E':[

        ],
        'F':[

        ],
        'G':[

        ],
        'H':[

        ],
        'I':[

        ],
        'J':[

        ],
        'K':[

        ],
        'L':[

        ],
        'M':[

        ],
        'N':[

        ],
        'O':[

        ],
        'P':[

        ],
        'Q':[

        ],
        'R':[

        ],
        'S':[

        ],
        'T':[

        ],
        'U':[

        ],
        'V':[

        ],
        'W':[

        ],
        'X':[

        ],
        'Y':[

        ],
        'Z':[

        ],

    };
}

function createLetterCircles(){
    alphabet.forEach(letter => {
        const letterDiv = document.createElement('div');
        letterDiv.className = 'letter';
        letterDiv.textContent = letter;
        letterCirclesContainer.appendChild(letterDiv);
        letterElements.push(letterDiv)
});
}

function getRandomQuestion(letter){
    const questions = questionsDatabase[letter];
    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
}

function startGame() {
    gameActive = true;
    currentLetterIndex = 0;
    skipsRemaining = 3;
    startButton.style.display = 'none';
    skipButton.style.display = 'inline-block';
    skipsElement.textContent = 'Skips: ' + skipsRemaining + ' remaining';
    answerInput.disabled = false;
    answerInput.focus();
    letterElements.forEach(element => {
        element.className = 'letter';
    });
    letterElements[currentLetterIndex].style.fontWeight = 'bold';
    startTime = Date.now();
    timerInverval = setInterval(updateTimer, 100);
    setNextQuestion();
}
function updateTimer() {
    currentTime = Date.now();
    elapsedTime = (currentTime - startTime)/1000;
    timerElement.textContent = 'Time: ' + elapsedTime.toFixed(1);
    totalTime = elapsedTime;
}
function setNextQuestion() {
    if (currentLetterIndex >= alphabet.length)
        if (currentLetterIndex >= alphabet.length  && skipsRemaining ==0) {
            endGame();
            return;
        }
        currentLetter = alphabet[currentLetterIndex]
        currentQuestion = getRandomQuestion(currentLetter);
        answerInput.value = '';
        answerInput.focus();
}
function handleAnswer() {
    if (!gameActive){
        return;
    }
    answer = answerInput.value.trim();
    if (!answer) {
        return;
    }
    currentLetter = alphabet[currentLetterIndex];
    if (answer.toUpperCase().startswith(currentLetter)) {
        letterElements[currentLetterIndex].classList.add('completed');
        letterElements[currentLetterIndex].style.fontWeight = 'normal';
        currentLetterIndex++;
        if(currentLetterIndex < alphabet.length){
            letterElements[currentLetterIndex].style.fontWeight = 'bold';
        }
        setNextQuestion();
    }
    else{
        letterElements[currentLetterIndex].classList.add('incorrect');
        answerInput.value = '';
    }
function handleSkip() {
    if (skipsRemaining <=0 || !gameActive){
        return;
    }
    skipsRemaining--;
    skipsElement.textContent = 'Skips remaining: ' + skipsRemaining;
    skipButton.textContent = "Skip(" + skipsRemaining + " left";
    letterElements[currentLetterIndex].classList.add('skipped');
    letterElements[currentLetterIndex].style.fontWeight = 'normal';
    currentLetterIndex++;
    if (currentLetterIndex < alphabet.length){
        letterElements[currentLetterIndex].style.fontWeight = 'bold'
    }
    setNextQuestion();
    if (skipsRemaining =0){
        skipButton.disabled = true;
    }
}
function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    questionElement.textContent = 'Game Over! Time = ' + totalTime;
    answerInput.disabled = true;
    startButton.textContent = 'Play Again';
    skipButton.style.display = 'none';
    completedCount = document.querySelectorAll('.letter.completed').length;
    playerName = prompt("Enter your name for the leaderboard:", "Player");
    if (playerName){
        addToLeaderboard(playerName, totalTime, completedCount);
    }}
function addToLeaderboard(name, time, lettersCompleted){

}   
}

