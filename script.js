function initializeGame() {
    createLetterCircles();
    initializeQuestions();
    // leaderboard setup, not rly used rn
    let leaderboard = [];
    if(localStorage.getItem('geoLeaderboard')){
        leaderboard = JSON.parse(localStorage.getItem('geoLeaderboard'));
        updateLeaderboardDisplay(leaderboard);
    }
    // event handlers
    startButton.addEventListener('click', startGame);
    skipButton.addEventListener('click', handleSkip);
    answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter'){
            handleSubmit();
        }
    });
}

window.onload = initializeGame;