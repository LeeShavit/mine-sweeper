'use strict'



function checkIfBest() {
    if (!getCurrBestScore()) {
        updateBestScore()
        return
    }
    var bestScore = getCurrBestScore()
    if (gGame.secsPassed < bestScore) {
        updateBestScore()
    }
}

function updateBestScore() {
    var level = getLevel()
    const player = prompt('You Got the new best score! What\'s your name?')
    const score = gGame.secsPassed
    localStorage.setItem(`bestPlayer${level}`, player)
    localStorage.setItem(`bestScore${level}`, '' + score)
    updateScoreBoard()
}

function getCurrBestScore() {
    var level = getLevel()
    return localStorage.getItem(`bestScore${level}`)
}

function updateScoreBoard() {
    var level = 0
    if (gLevel.size === 4) {
        level = 1
    } else if (gLevel.size === 8) {
        level = 2
    } else {
        level = 3
    }
    const score = localStorage.getItem(`bestScore${level}`)
    const player = localStorage.getItem(`bestPlayer${level}`)
    const elScore = document.querySelector(`.level-${level} span`)
    elScore.innerText = ` ${player}, with a score of ${score} seconds!`

}

function getLevel() {
    if (gLevel.size === 4) {
        return 1
    } else if (gLevel.size === 8) {
        return 2
    } else {
        return 3
    }
}

function renderScoreBoard(){
    for (var i = 0; i < 3; i++) {
        const score = localStorage.getItem(`bestScore${i+1}`)
        const player = localStorage.getItem(`bestPlayer${i+1}`)
        const elScore = document.querySelector(`.level-${i+1} span`)
        elScore.innerText = ` ${player}, with a score of ${score} seconds!`
    }
}



