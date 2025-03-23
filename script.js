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
let skippedLetters = [];
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
        'A': [
            { question: "U.S. state where the Ozarks are located", correctAnswer: "Arkansas" },
        ],
        'B': [
            { question: "State in northeast Brazil", correctAnswer: "Bahia" },
        ],
        'C': [
            { question: "Capital of Venezuela", correctAnswer: "Caracas" },
        ],
        'D': [
            { question: "City with the tallest building in the world", correctAnswer: "Dubai" },
        ],
        'E': [
            { question: "Only African country with Spanish as its official language", correctAnswer: "Equatorial Guinea" },
        ],
        'F': [
            { question: "Largest city in the interior region of Alaska", correctAnswer: "Fairbanks" },
           
        ],
        'G': [
            { question: "Port city in Scotland's western lowlands", correctAnswer: "Glasgow" },
        ],
        'H': [
            { question: "U.S. state that Kauai is located in", correctAnswer: "Hawaii" },
        ],
        'I': [
            { question: "Spanish Island known for its nightlife and EDM", correctAnswer: "Ibiza" },
        ],
        'J': [
            { question: "Saudi Arabian port city on the Red Sea", correctAnswer: "Jeddah" },
        ],
        'K': [
            { question: "Country in the Middle East that shares its name with its capital", correctAnswer: "Kuwait" },
        ],
        'L': [
            { question: "Country in Europe that shares its name with its capital", correctAnswer: "Luxembourg" },
        ],
        'M': [
            { question: "Country with the city of Marrakesh", correctAnswer: "Morocco" },
        ],
        'N': [
            { question: "U.S. state where Madison Square Garden is located", correctAnswer: "New York" },
        ],
        'O': [
            { question: "Capital city in the midwest of America", correctAnswer: "Omaha" },
        ],
        'P': [
            { question: "Europe's largest rice growing region located in Italy", correctAnswer: "Po Valley" },
        ],
        'Q': [
            { question: "City in South America with a population of 2.8 million", correctAnswer: "Quito" },
        ],
        'R': [
            { question: "African country bordering Uganda", correctAnswer: "Rwanda" },
        ],
        'S': [
            { question: "State in Australia with Alice Springs", correctAnswer: "South Australia" },
        ],
        'T': [
            { question: "Australian region that Cradle Mountain is located in", correctAnswer: "Tasmania" },
        ],
        'U': [
            { question: "City in southern Argentina known as the gateway to Antarctica", correctAnswer: "Ushuaia" },
        ],
        'V': [
            { question: "Largest city in British Columbia", correctAnswer: "Vancouver" },
        ],
        'W': [
            { question: "Sits near the North Island's southernmost point in New Zealand", correctAnswer: "Wellington" },
        ],
        'X': [
            { question: "Largest city in the world starting with X", correctAnswer: "Xiamen" },
        ],
        'Y': [
            { question: "Merida is located in this Mexican region", correctAnswer: "Yucatan" },
        ],
        'Z': [
            { question: "City on the Croatian coast in between Zagreb and Split", correctAnswer: "Zadar" },
        ]
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
    document.getElementById('submit-button').disabled = false;
    letterElements.forEach(element => {
        element.className = 'letter';
    });
    letterElements[currentLetterIndex].style.fontWeight = 'bold';
    startTime = Date.now();
    totalTime = 150;
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
    if (seconds < 10) {
        formattedSeconds = '0' + seconds; 
    }   
    else {
        formattedSeconds = seconds; 
}
timerElement.textContent = 'Time: ' + minutes + ':' + seconds;
}
function setNextQuestion() {
    if (currentLetterIndex >= alphabet.length && skippedLetters.length === 0){
            endGame();
            return;
        }
        if (currentLetterIndex >= alphabet.length && skippedLetters.length > 0){
            for(let i = 0; i < skippedLetters.length; i++) {
                currentLetterIndex = skippedLetters[i];
                letterElements[currentLetterIndex].style.fontWeight = 'bold';
                const currentLetter = alphabet[currentLetterIndex];
                const savedQuestion = questionsDatabase[currentLetter][0]
                questionElement.textContent = savedQuestion.question;
                currentQuestion = savedQuestion;
                answerInput.value = '';
                answerInput.focus();
                return;

            }
            if(skippedLetters.length ===0){
                endGame();
            }
            return;
        }
      
    const currentLetter = alphabet[currentLetterIndex];
    const randomQuestion = getRandomQuestion(currentLetter);
    questionElement.textContent = randomQuestion.question;
    currentQuestion = randomQuestion;
    answerInput.value = '';
    answerInput.focus();
}
function getRandomQuestion(letter){
    const questions = questionsDatabase[letter];
    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
}
function handleSubmit() {
    if (!gameActive){
        return;
    }
    answer = answerInput.value.trim();
    if (!answer) {
        return;
    }
    correctAnswer = currentQuestion.correctAnswer;
    if (answer.toUpperCase() === correctAnswer.toUpperCase()) {
        letterElements[currentLetterIndex].classList.add('completed');
        letterElements[currentLetterIndex].style.fontWeight = 'normal';
    }
    else{
        letterElements[currentLetterIndex].classList.add('incorrect');
    }
    letterElements[currentLetterIndex].style.fontWeight = 'normal';
    answerInput.value = '';
    currentLetterIndex++;
    setNextQuestion();
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
    skippedLetters.push(currentLetterIndex);
    currentLetterIndex++;
    if (currentLetterIndex < alphabet.length){
        letterElements[currentLetterIndex].style.fontWeight = 'bold';
    }
    setNextQuestion();
    if (skipsRemaining ===0){
        skipButton.disabled = true;
    }
}
function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    questionElement.textContent = 'Game Over! Time = ' + totalTime.toFixed(1);
    answerInput.disabled = true;
    startButton.style.display = 'inline-block';
    startButton.textContent = 'Play Again';
    skipButton.style.display = 'none';
    completedCount = document.querySelectorAll('.letter.completed').length;
    playerName = prompt("Enter your name for the leaderboard:", "Player");
    if (playerName){
        addToLeaderboard(playerName, totalTime, completedCount);
    }
    document.querySelector('.leaderboard').style.display = 'block';
}
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
function initializeGame() {
    createLetterCircles();
    initializeQuestions();
    let leaderboard = [];
    if(localStorage.getItem('geoLeaderboard')){
        leaderboard = JSON.parse(localStorage.getItem('geoLeaderboard'));
        updateLeaderboardDisplay(leaderboard);
    }
    startButton.addEventListener('click', startGame);
    skipButton.addEventListener('click', handleSkip);
    document.getElementById('submit-button').addEventListener('click', handleSubmit);
    answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter'){
            handleSubmit();
        }
    });
}
window.onload = initializeGame;


