import ConnectFourBase from '../public/js/game/base.js';
import { START_GAME, MOVE, ABORT } from '../public/js/other/messages.js';
import StatTracker from './stats.js';

class ConnectFourServer extends ConnectFourBase {
    constructor(players, finishCallback) {
        super();
        this.players = players;
        this._finishCallback = finishCallback;
        this._isFinished = false;

        for (let i = 0; i < this.players.length; i++) {
            this.players[i].on('message', data => {
                let message = JSON.parse(data);
                this._onMessage(message.type, message.data, i);
            });

            this.players[i].on('close', code => {
                this._onClose(code, i);
            });
        }

        for (let i = 0; i < this.players.length; i++)
            this._sendMessage(i, START_GAME, i);

        StatTracker.onGameStarted();
    }

    _sendMessage(player, type, data) {
        if (!this.players) return;
        this.players[player].send(JSON.stringify({ type, data }));
    }

    _finish() {
        this._isFinished = true;
        this._finishCallback();
    }

    _onMessage(type, data, player) {
        if (this._isFinished) return;

        if (type === MOVE) {
            if (this.move(player, data)) {
                this._sendMessage(this._otherPlayer(player), MOVE, data);

                let state = this.checkState();
                if (state.finished) {
                    if (state.outcome == 'win') StatTracker.onGameWon();
                    else if (state.outcome == 'tie') StatTracker.onGameTied();
                    
                    this._finish();
                }
            }
        }
    }

    _onClose(code, player) {
        this._sendMessage(this._otherPlayer(player), ABORT);
        this._finish();
    }

    delete() {
        delete this.players;
    }
}

export default ConnectFourServer;