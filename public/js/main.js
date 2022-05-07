import ConnectFourClient from './game/client.js';
import Modals from './other/modals.js';

const modalContainer = document.getElementById('modal-container');
const modalMessage = document.getElementById('modal-message');
const modalButtons = document.getElementById('modal-buttons');
Modals.init(modalContainer, modalMessage, modalButtons);

const gameContainer = document.getElementById('game-container');
const turnContainer = document.getElementById('turn-container');
new ConnectFourClient(gameContainer, turnContainer);