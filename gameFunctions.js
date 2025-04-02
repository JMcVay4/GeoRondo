const letterCirclesContainer = document.querySelector('.letter-circles');
const questionElement = document.querySelector('.question');
const answerInput = document.getElementById('answer-input')
const startButton = document.getElementById('start-button');
const skipButton = document.getElementById('skip-button');
const timerElement = document.querySelector('.timer');
const skipsElement = document.querySelector('.skips');
const leaderboardTable = document.getElementById('leaderboard-table');

let timeLimit = 150;
let alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
let letterElements = [];
let skippedLetters = [];
let currentLetterIndex = 0;
let gameActive = false;
let startTime = 0;
let totalTime = 0;
let timerInterval;
let skipsRemaining = 3
let questionsDatabase = {};
let currentQuestion = '';
let skipMode = false; // true if the user is now answering skipped questions

// keep track of letter divs in array for easy update
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
    // answerInput.disabled = false;
    // answerInput.focus();
    startTime = Date.now();
    totalTime = timeLimit;
    timerInterval = setInterval(updateTimer, 1000);
    setNextQuestion();
}

function updateTimer() {
    totalTime--;
    if(totalTime <=0){
        clearInterval(timerInterval);
        endGame();
    }
    seconds = totalTime % 60;
    minutes = Math.floor(totalTime/60);
    let formattedSeconds;
    formattedSeconds = seconds < 10 ? "0" + seconds : seconds;
    timerElement.textContent = 'Time: ' + minutes + ':' + formattedSeconds;
}

function setNextQuestion() {
    // handle skipped letters first (or possible game end)
    if (currentLetterIndex >= alphabet.length || skipMode) {
        if (skippedLetters.length === 0){
            endGame();
            return;
        }
        else {
            skipMode = true;
            currentLetterIndex = skippedLetters[0];
            letterElements[currentLetterIndex].classList.remove('skipped');
            letterElements[currentLetterIndex].classList.add('active');
            const currentLetter = alphabet[currentLetterIndex];
            const savedQuestion = questionsDatabase[currentLetter][0]
            questionElement.textContent = savedQuestion.question;
            currentQuestion = savedQuestion;
            answerInput.value = '';
            answerInput.focus();
        }
    }    
    // handle normal game progression
    const currentLetter = alphabet[currentLetterIndex];
    const randomQuestion = getRandomQuestion(currentLetter);
    letterElements[currentLetterIndex].classList.add('active');
    questionElement.textContent = randomQuestion.question;
    currentQuestion = randomQuestion;
    answerInput.value = '';
    answerInput.focus();
}

function handleSubmit() {
    if (!gameActive){
        return;
    }
    answer = answerInput.value.trim();
    if (!answer) {
        return;
    }
    if (answer.toUpperCase() === 'PASS') {
        handleSkip();
        return;
    }
    let elem = letterElements[currentLetterIndex];
    elem.classList.remove('active')
    correctAnswers = currentQuestion.correctAnswers;
    elem.classList.add('incorrect');
    correctAnswers.forEach(correctAnswer => {
        if (answer.toUpperCase() === correctAnswer.toUpperCase()) {
            elem.classList.remove('incorrect');
            elem.classList.add('completed');
        }
    });
    if (skipMode) {
        skippedLetters.shift(); // why is javascript like this
    }
    answerInput.value = '';
    currentLetterIndex++;
    setNextQuestion();
}
    
function handleSkip() {
    if (skipsRemaining <=0 || !gameActive || skippedLetters.includes(currentLetterIndex)){
        return;
    }
    skipsRemaining--;
    skipsElement.textContent = 'Skips remaining: ' + skipsRemaining;
    skipButton.textContent = "Skip(" + skipsRemaining + " left)";
    letterElements[currentLetterIndex].classList.remove('active');
    letterElements[currentLetterIndex].classList.add('skipped');
    letterElements[currentLetterIndex].style.fontWeight = 'normal';
    skippedLetters.push(currentLetterIndex);
    currentLetterIndex++;
    setNextQuestion();
    if (skipsRemaining ===0){
        skipButton.disabled = true;
    }
}

function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    let finalTime = timeLimit - totalTime;
    questionElement.textContent = 'Game Over! Time = ' + finalTime.toFixed(1);
    answerInput.disabled = true;
    startButton.style.display = 'inline-block';
    startButton.textContent = 'Play Again';
    skipButton.style.display = 'none';
    completedCount = document.querySelectorAll('.letter.completed').length;
    playerName = prompt("Enter your name for the leaderboard:", "Player");
    if (playerName){
        addToLeaderboard(playerName, finalTime, completedCount);
    }
    document.querySelector('.leaderboard').style.display = 'block';
}

// leaderboard functions
function addToLeaderboard(name, time, lettersCompleted){
    entry = {name, time, lettersCompleted};
    let leaderboard = [];
    if(localStorage.getItem('geoLeaderboard')) {
        leaderboard = JSON.parse(localStorage.getItem('geoLeaderboard'));
    }
    leaderboard.push(entry);
    leaderboard.sort((a,b) => {
        if (b.lettersCompleted !== a.lettersCompleted) {
            return b.lettersCompleted - a.lettersCompleted;
        }
        return a.time - b.time;
    });
    leaderboard = leaderboard.slice(0,10);
    localStorage.setItem('geoLeaderboard', JSON.stringify(leaderboard));
    updateLeaderboardDisplay(leaderboard);
}   
function updateLeaderboardDisplay(leaderboard){
    while(leaderboardTable.rows.length >1){
        leaderboardTable.deleteRow(1);
    }
    leaderboard.forEach((entry, index)=> {
        row = leaderboardTable.insertRow();
        rankCell = row.insertCell();
        rankCell.textContent = index + 1;
        nameCell = row.insertCell();
        nameCell.textcontent = entry.name;
        timeCell = row.insertCell();
        timeCell.textContent = entry.time.toFixed(1);
        lettersCell = row.insertCell();
        lettersCell.textContent = entry.lettersCompleted;
    });
}
