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
var gGame = {}
var timerId
var gElHint
var isHintOn = false

var gCreateMode = false
var isManual = false
var gTotalMinesCreated

var gSteps
var gChangedCells = []
var gChangedCounts = []
var isDark = false

var isMegaHintOn = false
var megaIdxs = []

function onInit() {
    gGame = {
        isOn: false,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0,
        lives: 3,
        safeClick: 3
    }
    gBoard = []
    gStartPos = null
    gTotalMinesCreated = 0
    gSteps = []
    buildBoard(gLevel.size)
    renderBoard(gBoard)
    renderScoreBoard()
    updateMarkCounter()
    updateSmiley()
    updateTimer()
    updateLivesLeft()
    saveStep()
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
            var classStr = 'class="closed"'
            if (gStartPos && gStartPos.i === i && gStartPos.j === j || gBoard[i][j].isShown) {
                classStr = ''
            }
            if(board[i][j].isMarked){
                classStr= 'class="closed marked"'
            }
            strHTML += `<td ${data} ${classStr} onclick="onCellClicked(this,${i},${j})" oncontextmenu="onCellMarked(this,${i},${j})">${content}</td>`
        }
        strHTML += '</tr>'
    }
    const elBoard = document.querySelector('.board')
    elBoard.innerHTML = strHTML

}
function getCellContent(i, j) {
    if (gBoard[i][j].isMarked) return '🚩'
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

function onCellClicked(elCell, i, j) {
    if (isMegaHintOn) {
        megaIdxs.push({ i, j })
        if (megaIdxs.length === 2) activateMegaHint()
        return

    }
    if (gCreateMode) {
        positionMine(elCell, i, j)
        return
    }
    if (isHintOn) {
        revealForHint(i, j)
        return
    }
    if (gBoard[i][j].isMarked) return
    if (gGame.shownCount === 0) {
        gStartPos = { i, j }
        if (!gTotalMinesCreated) {
            createMines()
        }
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
    gChangedCounts = {
        shownCount: gGame.shownCount,
        markedCount: gGame.markedCount,
        mines: gLevel.mines
    }
    expandShown(elCell, i, j)
    checkGameWon()
    saveStep()
}

function onCellMarked(elCell, i, j) {
    if (!gGame.isOn) return
    const currCell = gBoard[i][j]
    if (currCell.isShown) return
    gChangedCells.push({
        i: i,
        j: j,
        minesAroundCount: gBoard[i][j].minesAroundCount,
        isShown: gBoard[i][j].isShown,
        isMine: gBoard[i][j].isMine,
        isMarked: gBoard[i][j].isMarked,
    })

    if (!currCell.isMarked) {
        gChangedCounts = {
            shownCount: gGame.shownCount,
            markedCount: gGame.markedCount,
            mines: gLevel.mines
        }
        // add flag
        if (gGame.markedCount === gLevel.mines) return
        gBoard[i][j].isMarked = true
        elCell.innerText = '🚩'
        elCell.classList.add("marked")
        gGame.markedCount++
        checkGameWon(i, j)
    } else {  //remove flag
        currCell.isMarked = false
        elCell.innerText = getCellContent(i, j)
        elCell.classList.remove("marked")
        gGame.markedCount--
    }
    const elMarkCount = document.querySelector('.mark-count span')
    elMarkCount.innerText = gLevel.mines - gGame.markedCount
    saveStep()
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
        setTimeout(() => elCell.style.removeProperty("border-color"), 1000)
        return
    } else {
        revealAllMines()
        gGame.isOn = false
        endTimer()
        updateSmiley('lost')
    }
}
function onRestartGame(size, mineCount) {
    if (gCreateMode) return
    clearInterval(timerId)
    if (size && mineCount) {
        gLevel.size = size
        gLevel.mines = mineCount
    } else {
        switch (gLevel.size) {
            case 4: gLevel.mines = 2
                break
            case 8: gLevel.mines = 14
                break
            case 12: gLevel.mines = 32
                break
        }
    }
    restartHints()
    onInit()
}

function restartHints() {
    const elHints = document.querySelectorAll('.mega,.hint')
    for (var elHint of elHints) {
        elHint.classList.remove('hide')
        elHint.classList.remove('off')
    }
}

function expandShown(elCell, i, j) {
    revealCell(elCell, i, j)
    if (gBoard[i][j].minesAroundCount === 0) revealNegs(i, j)
}

function revealCell(elCell, i, j) {
    if (gBoard[i][j].isShown) return
    const currCell = {
        i: i,
        j: j,
        minesAroundCount: gBoard[i][j].minesAroundCount,
        isShown: gBoard[i][j].isShown,
        isMine: gBoard[i][j].isMine,
        isMarked: gBoard[i][j].isMarked,
    }
    gChangedCells.push(currCell)
    gBoard[i][j].isShown = true
    gGame.shownCount++
    elCell.classList.remove("closed")

}


function revealNegs(rowIdx, colIdx) {
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (i === rowIdx && j === colIdx) continue
            if (j < 0 || j >= gBoard[0].length) continue
            var currCell = gBoard[i][j]
            if (!currCell.isMine && !currCell.isShown) {
                var elCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`)
                expandShown(elCell, i, j)
            }
        }
    }
}

function revealAllMines() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            if (gBoard[i][j].isMine) {
                var elCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`)
                elCell.innerText = '💣'
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
    const emptyPos = []
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            const currCell = gBoard[i][j]
            if (!currCell.isMine && gStartPos.i !== i && gStartPos.j !== j) {
                emptyPos.push({ i, j })
            }
        }
    }

    const randIdx = getRandomIntInclusive(0, emptyPos.length - 1)
    return emptyPos[randIdx]
}

function startTimer() {
    timerId = setInterval(updateTimer, 1000)
}

function updateTimer() {
    var elTimer = document.querySelector('.timer span')
    elTimer.innerText = gGame.secsPassed
    gGame.secsPassed++
}

function endTimer() {
    clearInterval(timerId)
}
function updateMarkCounter() {
    const elMarkCount = document.querySelector('.mark-count span')
    elMarkCount.innerText = gLevel.mines - gGame.markedCount
}

function updateLivesLeft() {
    const elLives = document.querySelector('.lives span')
    var StrLives = ''
    for (var i = 0; i < gGame.lives; i++) {
        StrLives += '🩵'
    }
    elLives.innerText = StrLives
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

function onHint(elHint) {
    gElHint= elHint
    elHint.classList.add("on")
    isHintOn = true
}

function revealForHint(rowIdx, colIdx) {
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= gBoard[0].length) continue
            if (!gBoard[i][j].isShown) {
                tempReveal(i, j, 1)
            }
        }
    }
    isHintOn = false
    gElHint.classList.replace('on','off')
}

function tempReveal(i, j, seconds) {
    var elCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`)
    elCell.classList.remove("closed")
    setTimeout(() => elCell.classList.add("closed"), seconds * 1000)
}

function onSafeClick() {
    if (gGame.safeClick <= 0) return
    var cellPos = getRandSafeCell()
    var elCell = document.querySelector(`[data-i="${cellPos.i}"][data-j="${cellPos.j}"]`)
    elCell.classList.add("safe")
    setTimeout(() => elCell.classList.remove("safe"), 2000)
    gGame.safeClick--
    const elClick = document.querySelector('.clicks span')
    elClick.innerText = gGame.safeClick
}

function getRandSafeCell() {
    const safePos = []
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            const currCell = gBoard[i][j]
            if (!currCell.isMine && !currCell.isShown) {
                safePos.push({ i, j })
            }
        }
    }
    const randIdx = getRandomIntInclusive(0, safePos.length - 1)
    return safePos[randIdx]
}

function onManualCreate() {
    onRestartGame()
    gCreateMode = true
    gTotalMinesCreated = 0
    var elMsg = document.querySelector('.create-count')
    elMsg.style.display = 'block'
    var elCounter = document.querySelector('.create-count span')
    elCounter.innerText = gLevel.mines - gTotalMinesCreated
}

function onExitCreateMode() {
    gCreateMode = false
    setTimeout(() => renderBoard, 1000, gBoard)
    var elMsg = document.querySelector('.create-count')
    elMsg.style.display = 'none'
    gLevel.mines = gTotalMinesCreated
    updateMarkCounter()
}

function positionMine(elCell, i, j) {
    gBoard[i][j].isMine = true
    elCell.classList.remove("closed")
    elCell.innerText = '💣'
    gTotalMinesCreated++
    var elCounter = document.querySelector('.create-count span')
    elCounter.innerText = gLevel.mines - gTotalMinesCreated
    if (gTotalMinesCreated === gLevel.mines) {
        gCreateMode = false
        setTimeout(() => renderBoard, 1000, gBoard)
        var elMsg = document.querySelector('.create-count')
        elMsg.style.display = 'none'
    }
}

function saveStep() {
    const currStep = {
        changedCells: gChangedCells,
        shownCount: gChangedCounts.shownCount,
        markedCount: gChangedCounts.markedCount,
        mines: gChangedCounts.mines
    }
    gSteps.push(currStep)
    gChangedCells = []
    gChangedCounts = {}
}

function onUndo() {
    if (gSteps.length < 2) return
    //undoBoardChanges()
    const prevStep = gSteps.pop()
    undoBoardChanges(prevStep.changedCells)
    //update model
    console.log(prevStep)
    gGame.shownCount = prevStep.shownCount
    gGame.markedCount = prevStep.markedCount
    gLevel.mines = prevStep.mines
    //update DOM
    renderBoard(gBoard)
    updateMarkCounter()
}

function undoBoardChanges(changedCells) {
    for (var i = 0; i < changedCells.length; i++) {
        var changedCell = changedCells[i]
        const iIdx = changedCell.i
        const jIdx = changedCell.j
        gBoard[iIdx][jIdx].minesAroundCount = changedCell.minesAroundCount
        gBoard[iIdx][jIdx].isShown = changedCell.isShown
        gBoard[iIdx][jIdx].isMine = changedCell.isMine
        gBoard[iIdx][jIdx].isMarked = changedCell.isMarked
    }
}


function onOpenLevelModal() {
    const elModal = document.querySelector('.level-modal')
    elModal.classList.add("show-modal")
}

function onCloseModal() {
    const elModal = document.querySelector('.level-modal')
    elModal.classList.remove("show-modal")
}

function onDarkMode(elBtn) {
    const elRoot = document.querySelector(':root')
    if (isDark) {
        elBtn.innerText = 'Dark Mode'
        elBtn.style.backgroundColor = '#57A6A1'
        elBtn.style.color = '#FFFFFF'
        elRoot.style.setProperty('--btn-color', '#F4DEB3')
        elRoot.style.setProperty('--displays-color', '#CCE0AC')
        elRoot.style.setProperty('--game-color', '#ffbaba')
        elRoot.style.setProperty('--page-color', '#ffdce1')
        elRoot.style.setProperty('--modal-color', '#c7f1fc')
        elRoot.style.setProperty('--text-color', '#000000')
        elRoot.style.setProperty('--background-img', `url('/img/light-background.png')`)
    } else {
        elBtn.innerText = 'Light Mode'
        elBtn.style.backgroundColor = 'pink'
        elBtn.style.color = '#000000'
        elRoot.style.setProperty('--btn-color', '#57A6A1')
        elRoot.style.setProperty('--displays-color', '#240750')
        elRoot.style.setProperty('--game-color', '#344C64')
        elRoot.style.setProperty('--page-color', '#2E073F')
        elRoot.style.setProperty('--modal-color', '#1A3636')
        elRoot.style.setProperty('--text-color', '#FFFFFF')
        elRoot.style.setProperty('--background-img', `url('/img/dark-background.png')`)

    }
    isDark = !isDark
}

function onMegaHint(elMegaHint) {
    elMegaHint.classList.add("hide")
    isMegaHintOn = true
    console.log('on')
}

function activateMegaHint() {
    const startIdx = {}
    const endIdx = {}
    if (megaIdxs[0].i < megaIdxs[1].i) {
        startIdx.i = megaIdxs[0].i
        endIdx.i = megaIdxs[1].i
    } else {
        startIdx.i = megaIdxs[1].i
        endIdx.i = megaIdxs[0].i
    }
    if (megaIdxs[0].j < megaIdxs[1].j) {
        startIdx.j = megaIdxs[0].j
        endIdx.j = megaIdxs[1].j
    } else {
        startIdx.j = megaIdxs[1].j
        endIdx.j = megaIdxs[0].j
    }
    tempRevealSection(startIdx, endIdx)
    megaIdxs = []
    isMegaHintOn = false
}

function tempRevealSection(startIdx, endIdx) {
    for (var i = startIdx.i; i <= endIdx.i; i++) {
        for (var j = startIdx.j; j <= endIdx.j; j++) {
            tempReveal(i, j, 2)
        }
    }
}

function onExterminator(elBtn) {
    const mineCount = gLevel.mines < 3 ? 1 : 3
    gLevel.mines -= mineCount
    updateMarkCounter()
    for (var i = 0; i < mineCount; i++) {
        const randMinePos = getRandMine()
        gBoard[randMinePos.i][randMinePos.j].isMine = false
        gBoard[randMinePos.i][randMinePos.j].isMarked = false
        reduceMinesNegsAround(randMinePos.i, randMinePos.j)
    }
    renderBoard(gBoard)
    console.log(gBoard)
    elBtn.classList.add("hide")
}

function reduceMinesNegsAround(rowIdx, colIdx) {
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (i === rowIdx && j === colIdx) continue
            if (j < 0 || j >= gBoard[0].length) continue
            gBoard[i][j].minesAroundCount--
        }
    }
}

function getRandMine() {
    const minePos = []
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            const currCell = gBoard[i][j]
            if (currCell.isMine) {
                minePos.push({ i, j })
            }
        }
    }
    const randIdx = getRandomIntInclusive(0, minePos.length - 1)
    return minePos[randIdx]
}

function onOpenHowTo(){
    const elModal = document.querySelector('.guide')
    elModal.classList.remove("hide") 
}

function onCloseHowTo(){
    const elModal = document.querySelector('.guide')
    elModal.classList.add("hide") 
}