import Utils from "../other/utils.js";
import { BOARD_WIDTH, BOARD_HEIGHT, CONNECT_TO_WIN } from '../other/config.js';
import { Vec2 } from '../math/vec.js';

export default class ConnectFourBase {
    constructor() {
        this.reset();
    }

    reset() {
        this.board = Utils.initArray(null, BOARD_WIDTH, BOARD_HEIGHT);
        this.currentPlayer = 0;
    }

    move(player, x) {
        if (player != this.currentPlayer) return false;

        for (let y = 0; y < BOARD_HEIGHT; y++) {
            if (this.board[x][y] == null) {
                this.board[x][y] = player;
                this.currentPlayer = this._otherPlayer(this.currentPlayer);
                this._onPieceAdded(x, y, player);
                return true;
            }
        }

        return false;
    }

    checkState() {
        const checkFrom = (sx, sy, dx, dy) => {
            let pos = [];
            for (let i = 0; i < CONNECT_TO_WIN; i++) {
                let x = sx + i * dx;
                let y = sy + i * dy;
                if (x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT) return { finished: false };
                if (this.board[x][y] == null || this.board[x][y] != this.board[sx][sy]) return { finished: false };

                pos.push(Vec2(x, y));
            }
            return { finished: true, outcome: 'win', player: this.board[sx][sy], positions: pos };
        }

        // check for win
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x <= BOARD_WIDTH; x++) {
                for (let [dx, dy] of [[0,1], [1,0], [1,1], [1,-1]]) {
                    let res = checkFrom(x, y, dx, dy);
                    if (res.finished) return res;
                }
            }
        }
        
        // check for draw
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                if (this.board[x][y] == null) return { finished: false };
            }
        }

        return { finished: true, outcome: 'tie' };
    }

    _otherPlayer(player) {
        return (player + 1) % 2;
    }

    _onPieceAdded(x, y, player) {}
}