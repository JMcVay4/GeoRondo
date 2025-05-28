function initializeGame() {
    createLetterCircles();
    initializeQuestions();
    // leaderboard setup, not rly used rn
    let key = "geoLeaderboard_" + selectedDifficulty;
    let leaderboard = [];
    if(localStorage.getItem(key)){
        leaderboard = JSON.parse(localStorage.getItem(key));
        updateLeaderboardDisplay("leaderboard-" + selectedDifficulty, leaderboard);
    }
    // event handlers
    startButton.addEventListener('click', startGame);
    skipButton.addEventListener('click', handleSkip);
    dailyButton.addEventListener('click', startDailyChallenge);
    answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter'){
            handleSubmit();
        }
    });
}
window.onload = initializeGame;