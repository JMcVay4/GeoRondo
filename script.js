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
    timerElement.textContent = 'Time: ' + elapsedTime.toFixed(1)
}
