let allWords = [];
let unlearnedWords = [];
let retryQueue = []; 
let mistakeWords = []; 
let turnCounter = 0;
let isReviewTurn = false;
let correctCount = 0;
let incorrectCount = 0;

const wordDisplay = document.getElementById('word-display');
const meaningDisplay = document.getElementById('meaning-display');
const idDisplay = document.getElementById('id-badge');
const reviewBadge = document.getElementById('review-badge');
const actionBtn = document.getElementById('action-btn');
const judgmentBtns = document.getElementById('judgment-btns');
const resultScreen = document.getElementById('result-screen');
const finalStats = document.getElementById('final-stats');
const remainingDisplay = document.getElementById('remaining-count');
const correctDisplay = document.getElementById('correct-count');
const incorrectDisplay = document.getElementById('incorrect-count');
const startInput = document.getElementById('start-range');
const endInput = document.getElementById('end-range');
const retryMistakesBtn = document.getElementById('retry-mistakes-btn');

async function loadCSV() {
    try {
        const response = await fetch('words.csv?t=' + Date.now());
        const text = await response.text();
        const lines = text.trim().split(/\r?\n/);
        allWords = lines.map(line => {
            const parts = line.split(/[,\t]/);
            if (parts.length >= 3) {
                const id = parseInt(parts[0].replace(/"/g, '').trim());
                if (!isNaN(id)) return {
                    id: id,
                    word: parts[1].replace(/"/g, '').trim(),
                    meaning: parts.slice(2).join(',').replace(/^"|"$/g, '').trim()
                };
            }
            return null;
        }).filter(w => w !== null);
        updateRange();
    } catch (e) {
        wordDisplay.textContent = "CSV読み込みエラー";
    }
}

function updateRange() {
    const start = parseInt(startInput.value);
    const end = parseInt(endInput.value);
    const selectedRange = allWords.filter(w => w.id >= start && w.id <= end);
    startSession(selectedRange);
}

function startSession(wordList) {
    unlearnedWords = [...wordList];
    retryQueue = [];
    mistakeWords = [];
    turnCounter = 0;
    correctCount = 0;
    incorrectCount = 0;
    resultScreen.classList.add('hidden');
    
    if (unlearnedWords.length > 0) {
        updateStats();
        nextWord();
    } else {
        wordDisplay.textContent = "対象なし";
    }
}

function updateStats() {
    remainingDisplay.textContent = unlearnedWords.length;
    correctDisplay.textContent = correctCount;
    incorrectDisplay.textContent = incorrectCount;
}

function nextWord() {
    if (unlearnedWords.length === 0 && retryQueue.length === 0) {
        showResult();
        return;
    }

    const mode = document.querySelector('input[name="study-mode"]:checked').value;
    turnCounter++;
    let selected;

    if (mode === "review" && turnCounter % 3 === 0 && retryQueue.length > 0) {
        isReviewTurn = true;
        const idx = Math.floor(Math.random() * retryQueue.length);
        selected = retryQueue[idx];
        window.currentIdx = idx;
        reviewBadge.classList.remove('invisible');
    } else if (unlearnedWords.length > 0) {
        isReviewTurn = false;
        const idx = Math.floor(Math.random() * unlearnedWords.length);
        selected = unlearnedWords[idx];
        window.currentIdx = idx;
        reviewBadge.classList.add('invisible');
    } else {
        isReviewTurn = true;
        const idx = Math.floor(Math.random() * retryQueue.length);
        selected = retryQueue[idx];
        window.currentIdx = idx;
        reviewBadge.classList.remove('invisible');
    }

    idDisplay.textContent = `ID: ${selected.id}`;
    wordDisplay.textContent = selected.word;
    meaningDisplay.textContent = selected.meaning;
    meaningDisplay.classList.add('invisible');
    actionBtn.classList.remove('hidden');
    judgmentBtns.classList.add('hidden');
    window.currentWord = selected;
}

function showResult() {
    resultScreen.classList.remove('hidden');
    actionBtn.classList.add('hidden');
    judgmentBtns.classList.add('hidden');
    reviewBadge.classList.add('invisible');
    finalStats.innerHTML = `正解: ${correctCount} / 不正解: ${incorrectCount}`;

    if (mistakeWords.length === 0) {
        retryMistakesBtn.classList.add('hidden');
    } else {
        retryMistakesBtn.classList.remove('hidden');
        retryMistakesBtn.textContent = `間違えた ${mistakeWords.length} 問を復習`;
    }
}

actionBtn.addEventListener('click', () => {
    meaningDisplay.classList.remove('invisible');
    actionBtn.classList.add('hidden');
    judgmentBtns.classList.remove('hidden');
});

const handleJudgment = (isCorrect) => {
    const mode = document.querySelector('input[name="study-mode"]:checked').value;

    if (isReviewTurn) {
        if (isCorrect) retryQueue.splice(window.currentIdx, 1);
    } else {
        if (isCorrect) {
            correctCount++;
        } else {
            incorrectCount++;
            mistakeWords.push(window.currentWord);
            if (mode === "review") retryQueue.push(window.currentWord);
        }
        unlearnedWords.splice(window.currentIdx, 1);
    }
    updateStats();
    nextWord();
};

document.getElementById('correct-btn').addEventListener('click', () => handleJudgment(true));
document.getElementById('incorrect-btn').addEventListener('click', () => handleJudgment(false));
document.getElementById('restart-btn').addEventListener('click', updateRange);
document.getElementById('set-range-btn').addEventListener('click', updateRange);
retryMistakesBtn.addEventListener('click', () => startSession(mistakeWords));

loadCSV();