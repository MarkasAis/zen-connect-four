const playButton = document.getElementById('play-button');
const rulesButton = document.getElementById('rules-button');
const statsButton = document.getElementById('stats-button');
const closeButton = document.getElementById('close-button');

const buttonsContainer = document.getElementById('buttons-container');
const rulesContainer = document.getElementById('rules-container');
const statsContainer = document.getElementById('stats-container');

const openStatus = {};

function showElement(element) {
    if (element.isOpen) return;
    element.isOpen = true;

    element.classList.remove('fade-out');
    element.classList.add('fade-in');
}

function hideElement(element) {
    if (!element.isOpen) return;
    element.isOpen = false;

    element.classList.remove('fade-in');
    element.classList.add('fade-out');
}

function close() {
    showElement(buttonsContainer);
    hideElement(rulesContainer);
    hideElement(statsContainer);
    hideElement(closeButton);
}

playButton.onclick = () => {
    window.location.replace('/play');
};

rulesButton.onclick = () => {
    hideElement(buttonsContainer);
    showElement(rulesContainer);
    hideElement(statsContainer);
    showElement(closeButton);
};

statsButton.onclick = () => {
    hideElement(buttonsContainer);
    hideElement(rulesContainer);
    showElement(statsContainer);
    showElement(closeButton);
};

closeButton.onclick = close;

close();