'use strict'

window.addEventListener('contextmenu', function (e) {
    e.preventDefault();
}, false);

var gStartPos
var gBoard
var gLevel = {
    size: 4,
    mines: 2
}
var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    lives: 3
}
var timerId
var isHintOn= false


function onInit() {
    gBoard = []
    gStartPos = null
    buildBoard(gLevel.size)
    renderBoard(gBoard)
    updateMarkCounter()
    updateSmiley()
}

function buildBoard(size) {
    for (var i = 0; i < size; i++) {
        gBoard.push([])
        for (var j = 0; j < size; j++) {
            gBoard[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
        }
    }
}

function renderBoard(board) {
    var strHTML = ''
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>'
        for (var j = 0; j < board[0].length; j++) {
            const cell = board[i][j]
            const data = `data-i="${i}" data-j="${j}"`
            const content = getCellContent(i, j)
            if (gStartPos && gStartPos.i === i && gStartPos.j === j) {
                strHTML += `<td ${data} onclick="onCellClicked(this,${i},${j})" oncontextmenu="onCellMarked(this,${i},${j})">${content}</td>`
                continue
            }
            strHTML += `<td ${data} class="closed" onclick="onCellClicked(this,${i},${j})" oncontextmenu="onCellMarked(this,${i},${j})">${content}</td>`
        }
        strHTML += '</tr>'
    }
    const elBoard = document.querySelector('.board')
    elBoard.innerHTML = strHTML

}

function onCellClicked(elCell, i, j) {
    if(isHintOn){
        revealForHint(i,j)
        isHintOn=false
        return
    }
    if (gBoard[i][j].isMarked) return
    if (gGame.shownCount === 0) {
        gStartPos = { i, j }
        createMines()
        setMinesNegsCount()
        renderBoard(gBoard, elCell)
        gGame.isOn = true
        startTimer()
    }
    if (!gGame.isOn) return
    if (gBoard[i][j].isMine && !gBoard[i][j].isMarked) {
        clickedOnMine(elCell)
        return
    }
    expandShown(elCell, i, j)
    checkGameWon()
}

function onCellMarked(elCell, i, j) {
    const currCell = gBoard[i][j]
    if (currCell.isShown) return
    if (!currCell.isMarked) {  // add flag
        if (gGame.markedCount === gLevel.mines) return
        gBoard[i][j].isMarked = true
        elCell.innerText = '🚩'
        elCell.classList.add("marked")
        gGame.markedCount++
        checkGameWon(i, j)
    } else {  //remove flag
        currCell.isMarked = false
        if (currCell.isMine) {
            elCell.innerText = '💣'
        } else if (currCell.minesAroundCount === 0) {
            elCell.innerText = ''
        } else {
            elCell.innerText = currCell.minesAroundCount
        }
        elCell.classList.remove("marked")
        gGame.markedCount--
    }
    const elMarkCount = document.querySelector('.mark-count')
    elMarkCount.innerText = gLevel.mines - gGame.markedCount
}

function checkGameWon() {
    if (gGame.shownCount === (gLevel.size ** 2) - gLevel.mines &&
        gGame.markedCount === gLevel.mines) {
        gGame.isOn = false
        endTimer()
        updateSmiley('won')
        checkIfBest()
    }
}

function clickedOnMine(elCell) {
    if (gGame.lives > 0) {
        gGame.lives--
        updateLivesLeft()
        elCell.style.borderColor = 'red'
        setTimeout(() => elCell.style.borderColor = 'black', 1000)
        return
    } else {
        revealAllMines()
        gGame.isOn = false
        endTimer()
        updateSmiley()
    }
}


function onRestartGame(size, mineCount) {
    if (size && mineCount) {
        gLevel.size = size
        gLevel.mines = mineCount
    }
    gGame = {
        isOn: false,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0,
        lives: 3
    }
    onInit()
}

function expandShown(elCell, i, j) {
    revealCell(elCell, i, j)
    if (checkCellWithoutNegs(i, j)) revealNegs(i, j)
}

function getCellContent(i, j) {
    if (gBoard[i][j].isMine) return '💣'
    return gBoard[i][j].minesAroundCount ? gBoard[i][j].minesAroundCount : ''
}

function setMineNegsAround(rowIdx, colIdx) {
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (i === rowIdx && j === colIdx) continue
            if (j < 0 || j >= gBoard[0].length) continue
            gBoard[i][j].minesAroundCount++
        }
    }
}
function setMinesNegsCount() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            if (gBoard[i][j].isMine) {
                setMineNegsAround(i, j)
            }

        }
    }
}

function revealCell(elCell, i, j) {
    if (gBoard[i][j].isShown) return
    gBoard[i][j].isShown = true
    gGame.shownCount++
    elCell.classList.remove("closed")
}
function revealAllMines() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            if (gBoard[i][j].isMine) {
                var elCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`)
                revealCell(elCell, i, j)
            }

        }
    }
}

function checkCellWithoutNegs(rowIdx, colIdx) {
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (i === rowIdx && j === colIdx) continue
            if (j < 0 || j >= gBoard[0].length) continue
            if (gBoard[i][j].minesAroundCount === 0 && !gBoard[i][j].isMine) return true
        }
    }
    return false
}

function revealNegs(rowIdx, colIdx) {
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (i === rowIdx && j === colIdx) continue
            if (j < 0 || j >= gBoard[0].length) continue
            if (!gBoard[i][j].isMine) {
                var elCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`)
                revealCell(elCell, i, j)
            }
        }
    }
}

function createMines() {
    var mineCount = gLevel.mines
    for (var i = 0; i < mineCount; i++) {
        var newPos = getRandEmptyPos()
        gBoard[newPos.i][newPos.j].isMine = true
    }
}

function getRandEmptyPos() {
    const emptyPoss = []
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            const currCell = gBoard[i][j]
            if (!currCell.isMine && gStartPos.i !== i && gStartPos.j !== j) {
                emptyPoss.push({ i, j })
            }
        }
    }

    const randIdx = getRandomIntInclusive(0, emptyPoss.length - 1)
    return emptyPoss[randIdx]
}

function startTimer() {
    timerId = setInterval(updateTimer, 1000)
}

function updateTimer() {
    gGame.secsPassed++
    var elTimer = document.querySelector('.timer')
    elTimer.innerText = gGame.secsPassed
}

function endTimer() {
    clearInterval(timerId)
}
function updateMarkCounter() {
    const elMarkCount = document.querySelector('.mark-count')
    elMarkCount.innerText = gLevel.mines - gGame.markedCount
}

function updateLivesLeft() {
    const elLives = document.querySelector('.lives span')
    elLives.innerText = gGame.lives
}

function updateSmiley(mode) {
    var smiley = ''
    switch (mode) {
        case 'won': smiley = '😎'
            break;
        case 'lost': smiley = '🤯'
            break;
        default: smiley = '🙂'
            break;
    }
    const elSmiley = document.querySelector('.smiley')
    elSmiley.innerText = smiley

}

function onHint(elHint){
    elHint.classList.add("hide-hint")
    isHintOn=true
}

function revealForHint(rowIdx,colIdx){
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= gBoard[0].length) continue
            if (!gBoard[i][j].isShown) {
                tempReveal(i,j)
            }
        }
    }
}

function tempReveal(i,j){
    var elCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`)
    elCell.classList.remove("closed")
    setTimeout(()=>elCell.classList.add("closed"),1000)
}
