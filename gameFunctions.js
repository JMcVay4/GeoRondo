const letterCirclesContainer = document.querySelector('.letter-circles');
const questionElement = document.querySelector('.question');
const answerInput = document.getElementById('answer-input')
const startButton = document.getElementById('start-button');
const skipButton = document.getElementById('skip-button');
const timerElement = document.querySelector('.timer');
const skipsElement = document.querySelector('.skips');
const difficultySelect = document.getElementById('difficulty')
const leaderboardTable = document.getElementById('leaderboard-table');
const summaryDiv = document.getElementById('summary-container');
const table = document.getElementById('summary-table');

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
let savedSkippedQuestions = [];
let currentQuestion = '';
let selectedDifficulty = 'easy';
let playerAnswers = [];  // stores the following: {letter, question, correctAnswer, wasCorrect}
let skipMode = false; // true if the user is now answering skipped questions

difficultySelect.addEventListener('change', function () {
        selectedDifficulty = difficultySelect.value;
        const key = "geoLeaderboard_" + selectedDifficulty;
        const leaderboard = JSON.parse(localStorage.getItem(key)) || [];
        updateLeaderboardDisplay(leaderboard);
    });

// keep track of letter divs in array for easy update
function createLetterCircles(){
    const containerWidth = letterCirclesContainer.offsetWidth;
    const containerHeight = letterCirclesContainer.offsetHeight;
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    const radius = containerWidth * 0.25; 
    const totalLetters = alphabet.length;

    alphabet.forEach((letter, index) => {
        const letterDiv = document.createElement('div');
        letterDiv.className = 'letter';
        letterDiv.textContent = letter;

        const angleDeg = (360 / totalLetters) * index;
        const angleRad = angleDeg * (Math.PI / 180);

        const x = centerX + radius * Math.cos(angleRad) - 20;
        const y = centerY + radius * Math.sin(angleRad) - 20;

        letterDiv.style.left = `${x}px`;
        letterDiv.style.top = `${y}px`;

        letterCirclesContainer.appendChild(letterDiv);
        letterElements.push(letterDiv);
    });
}

function getRandomQuestion(letter){
    const questions = questionsDatabase[letter];
    const questionDifficulty = questions.filter(question => {
        return question.difficulty === selectedDifficulty;
    })
    const randomIndex = Math.floor(Math.random() * questionDifficulty.length);
    return questionDifficulty[randomIndex];
}

function startGame() {
    document.querySelector('.leaderboard').style.display = 'none';
    summaryDiv.classList.add('hidden');
    currentLetterIndex = 0;
    skipsRemaining = 3;
    skippedLetters = [];
    savedSkippedQuestions = [];
    playerAnswers = [];
    clearInterval(timerInterval);
    totalTime = timeLimit;
    gameActive = true;
    skipMode = false;
    answerInput.disabled = false;
    startButton.style.display = 'none';
    skipButton.style.display = 'inline-block';
    skipButton.disabled = false;
    difficultySelect.disabled = true;
    skipsElement.textContent = 'Skips: ' + skipsRemaining + ' remaining';
    letterElements.forEach(letter => {
        letter.classList.remove('completed', 'skipped', 'incorrect', 'active');
        letter.style.fontWeight = 'bold';
    });
    startTime = Date.now();
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
        skipMode = true;
        if (skippedLetters.length === 0) {
            endGame();
            return;
        }
        currentLetterIndex = skippedLetters[0];
        letterElements[currentLetterIndex].classList.remove('skipped');
        letterElements[currentLetterIndex].classList.add('active');
        currentQuestion = savedSkippedQuestions[0];
        questionElement.textContent = currentQuestion.question;
        answerInput.value = '';
        answerInput.focus();
        return;
    }
    
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
    let answer = answerInput.value.trim();
    if (!answer) {
        return;
    }
    if (answer.toUpperCase() === 'SKIP') {
        handleSkip();
        return;
    }
    let letter = letterElements[currentLetterIndex];
    let wasCorrect = false;
    let correctAnswers = currentQuestion.correctAnswers;
    playerAnswers.push({
        letter: alphabet[currentLetterIndex],
        question: currentQuestion.question,
        userAnswer: answer,
        wasCorrect: wasCorrect,
        correctAnswers: correctAnswers
    })
    letter.classList.remove('active')
    letter.classList.add('incorrect');
    correctAnswers.forEach(correctAnswer => {
        if (answer.toUpperCase() === correctAnswer.toUpperCase()) {
            letter.classList.remove('incorrect');
            letter.classList.add('completed');
            wasCorrect = true;
        }
    });
    playerAnswers[playerAnswers.length - 1].wasCorrect = wasCorrect;
    if (skipMode) {
        skippedLetters.shift(); // why is javascript like this
        savedSkippedQuestions.shift();
    }
    currentLetterIndex++;
    answerInput.value = '';
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
    playerAnswers.push({
        letter: alphabet[currentLetterIndex],
        question: currentQuestion.question,
        userAnswer: '',
        wasCorrect: false,
        correctAnswers: currentQuestion.correctAnswers
    });
    savedSkippedQuestions.push(currentQuestion);
    skippedLetters.push(currentLetterIndex)
    
       
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
    difficultySelect.disabled = false;
    completedCount = document.querySelectorAll('.letter.completed').length;
    playerName = prompt("Enter your name for the leaderboard:", "Player");
    if (playerName){
        addToLeaderboard(playerName, finalTime, completedCount);
    }
    document.querySelector('.leaderboard').style.display = 'block';
    document.getElementById("summary-container").classList.remove("hidden");
    document.getElementById("summary-container").style.display = 'block';
    showSummary(playerName, finalTime, completedCount);
}

function showSummary(playerName, finalTime, completedCount){
    while (table.rows.length > 1){
        table.deleteRow(1);
    }
    for (let i = 0; i < playerAnswers.length; i++) {
        let row = table.insertRow();
        let letterCell = row.insertCell();
        letterCell.textContent = playerAnswers[i].letter;
        let questionCell = row.insertCell();
        questionCell.textContent = playerAnswers[i].question;
        let userAnswerCell = row.insertCell();
        if (playerAnswers[i].userAnswer === "") {
            userAnswerCell.textContent = "Skipped";
        } 
        else {
            userAnswerCell.textContent = playerAnswers[i].userAnswer;
}
        let statusCell = row.insertCell();
        if(playerAnswers[i].wasCorrect === true){
            statusCell.textContent = "correct";
        }
        else{
            if (playerAnswers[i].userAnswer === "" ){
                statusCell.textContent = "Skipped";
            }
            else{
                statusCell.textContent = "Incorrect"
            }
            }
        let correctAnswersCell = row.insertCell();
        correctAnswersCell.textContent = playerAnswers[i].correctAnswers.join(", ");
        }
    summaryDiv.classList.remove("hidden");
    }



function addToLeaderboard(name, time, lettersCompleted){
    entry = {name, time, lettersCompleted};
    let key = "geoLeaderboard_" + selectedDifficulty;
    let leaderboard = [];
    if(localStorage.getItem(key)) {
        leaderboard = JSON.parse(localStorage.getItem(key));
    }
    leaderboard = leaderboard.filter(e => e.name !== name || 
        (e.lettersCompleted > lettersCompleted || 
        (e.lettersCompleted === lettersCompleted && e.time <= time)));
    leaderboard.push(entry);
    leaderboard.sort((a,b) => {
        if (b.lettersCompleted !== a.lettersCompleted) {
            return b.lettersCompleted - a.lettersCompleted;
        }
        return a.time - b.time;
    });
    const uniqueName = {};
    leaderboard = leaderboard.filter(entry => {
        if (!uniqueName[entry.name]) {
            uniqueName[entry.name] = true;
            return true;
        }
        return false;
    })
    leaderboard = leaderboard.slice(0,10);
    localStorage.setItem(key, JSON.stringify(leaderboard));
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
        nameCell.textContent = entry.name;
        timeCell = row.insertCell();
        timeCell.textContent = entry.time.toFixed(1);
        lettersCell = row.insertCell();
        lettersCell.textContent = entry.lettersCompleted;
    });
}
