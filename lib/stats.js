export default class StatTracker {
    static _gamesStarted = 0;
    static _gamesWon = 0;
    static _gamesTied = 0;

    static get gamesStarted() { return StatTracker._gamesStarted; }
    static get gamesWon() { return StatTracker._gamesWon; }
    static get gamesTied() { return StatTracker._gamesTied; }

    static onGameStarted() {
        StatTracker._gamesStarted += 1;
    }

    static onGameWon() {
        StatTracker._gamesWon += 1;
    }

    static onGameTied() {
        StatTracker._gamesTied += 1;
    }
}