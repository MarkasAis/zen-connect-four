import ConnectFourBase from "./base.js";
import Camera from "../webgl/camera.js";
import Renderer from "../webgl/renderer.js";
import Utils from "../other/utils.js";
import Maths from "../math/maths.js";
import { START_GAME, MOVE, JOIN_QUEUE, ABORT, PING, PONG } from "../other/messages.js";
import { Vec2, Vec3, Vec4 } from "../math/vec.js";
import { BOARD_WIDTH, BOARD_HEIGHT } from "../other/config.js";
import Texture from "../webgl/texture.js";
import { BasicMaterial, HighlightMaterial } from "../webgl/material.js";
import Modals from "../other/modals.js";
import Timer from "../other/timer.js";
import AudioLibrary from "../other/audio.js";

const DEFAULT_LEAVE_ACTION = () => {
    window.location.replace('../');
}

const WEB_SOCKET_URL = (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host;

class Piece {
    constructor(gl, texture, startPosition, targetPosition, player) {
        this._startPosition = startPosition;
        this._targetPosition = targetPosition;
        this._position = startPosition;
        
        this._rotation = Maths.random(-Math.PI/2, Math.PI/2);
        this._targetRotation = this._rotation;

        this.player = player;

        this._material = new BasicMaterial(gl, texture, Vec4(1.2, 1.2, 1.2, 1), this.player == 0 ? 0.5 : -2);

        this._won = false;
        this._animation = 0;

        this._velocity = 0;
        this._hitCount = 0;
    }

    onWin() {
        this._won = true;
    }

    update(deltatime) {
        this._animation += deltatime;
        this._animation = Maths.clamp(this._animation, 0, 1);

        let newPosition = Vec3.lerp(this._startPosition, this._targetPosition, Maths.easeOutBounce(this._animation));
        let newVelocity = newPosition[1] - this._position[1];

        if (this._velocity < 0 && newVelocity > 0) {
            this._hitCount++;
            let volume = 1 / this._hitCount;
            AudioLibrary.play('hit', { volume });
        }
        
        this._velocity = newVelocity;
        this._position = newPosition

        if (this._won) {
            this._targetRotation += 1 * deltatime;
            this._rotation = Maths.lerp(this._rotation, this._targetRotation, 10 * deltatime);
        }
    }

    render(renderer) {
        renderer.drawQuad(this._material, this._position, this._rotation);
    }
}

export default class ConnectFourClient extends ConnectFourBase {
    constructor(container, turnContainer) {
        super();
        this._container = container;
        this._turnContainer = turnContainer;
        this.renderer = new Renderer(this._container.offsetWidth, this._container.offsetHeight);
        this.canvas = this.renderer.canvas;

        this._container.appendChild(this.canvas);
        window.addEventListener('resize', () => { this._onResize(); });
        
        this.canvas.addEventListener('click', e => { this._onMouseClick(e); });
        document.addEventListener('mousemove', e => { this._mousePosition = Utils.mousePosOnCanvas(this.canvas, e); });

        this.ws = new WebSocket(WEB_SOCKET_URL);
        this.ws.addEventListener('message', e => {
            let message = JSON.parse(e.data);
            this._onMessage(message.type, message.data);
        });
        this.ws.addEventListener('open', () => { this._queue(); });

        this._disconnectTimeout = null;
        setInterval(() => {
            this._sendMessage(PING);
            this._disconnectTimeout = setTimeout(() => { this._onDisconnect(); }, 1000);
        }, 30000);

        this.player = null;
        this.camera = new Camera(this._container.offsetWidth / this._container.offsetHeight, 4);

        this._offset = Vec3.subtract(Vec3.divide(Vec3(BOARD_WIDTH, BOARD_HEIGHT, 0), 2), Vec3(0.5, 0.5, 0));
        this._inGame = false;

        this._timer = new Timer((dt) => {
            this._update(dt);
            this._render();
        });
        this._timer.start();

        Texture.load(this.renderer.gl, '../../images/wall.png').then(tex => { this._wallMaterial = new BasicMaterial(this.renderer.gl, tex); });
        Texture.load(this.renderer.gl, '../../images/hook.png').then(tex => { this._hookMaterial = new BasicMaterial(this.renderer.gl, tex); });
        Texture.load(this.renderer.gl, '../../images/tile.png').then(tex => { this._tileTextures = [ tex ]; });
        this._highlightMaterial = new HighlightMaterial(this.renderer.gl);

        AudioLibrary.load('hit', '../sounds/hit.mp3');
        AudioLibrary.load('win', '../sounds/win.mp3');
        AudioLibrary.load('lose', '../sounds/lose.mp3');
        AudioLibrary.load('music', '../sounds/music.mp3');
        AudioLibrary.play('music', { volume: 0.05, loop: true });
    }

    _onDisconnect() {
        this.ws.close();
        this.finish();
        Modals.open('You disconnected!', {
            'Leave': DEFAULT_LEAVE_ACTION
        });
    }

    _queue() {
        this._sendMessage(JOIN_QUEUE);
        Modals.open('Waiting for other players...', {
            'Leave': DEFAULT_LEAVE_ACTION
        });
    }

    _sendMessage(type, data) {
        this.ws.send(JSON.stringify({ type, data }));
    }

    move(x) {
        let success = super.move(this.player, x);
        if (success) this._sendMessage(MOVE, x);
        return success;
    }

    _showFinishScreen(message) {
        Modals.open(message, {
            'Play Again': () => { this._queue(); },
            'Leave': DEFAULT_LEAVE_ACTION
        });
    }

    checkState() {
        let res = super.checkState();

        if (!res.finished) {
            this._updateTurn();
            return;
        }

        let message = null;

        if (res.outcome == 'win') {
            let victory = res.player == this.player;
            message = victory ? 'You Won!' : 'You Lost';

            for (let [x, y] of res.positions) {
                this.pieces[x][y].onWin();
            }

            if (victory) AudioLibrary.play('win', { delay: 500 });
            else AudioLibrary.play('lose', { delay: 500 });
        } else {
            message = 'You tied!';
            AudioLibrary.play('lose', { delay: 500 });
        }

        this.finish();
        this._showFinishScreen(message);
    }

    _showTurn() {
        this._turnContainer.classList.remove('fade-out');
        this._turnContainer.classList.add('fade-in');
    }

    _updateTurn() {
        if (!this._inGame) {
            this._hideTurn();
            return;
        }

        this._hideTurn();
        setTimeout(() => {
            this._turnContainer.innerHTML = this._isMyTurn() ? "Your Turn" : "Opponents Turn";
            this._showTurn();
        }, 500);
    }

    _hideTurn() {
        this._turnContainer.classList.remove('fade-in');
        this._turnContainer.classList.add('fade-out');
    }

    start(player) {
        this.reset();
        Modals.close();
        this.pieces = Utils.initArray(null, BOARD_WIDTH, BOARD_HEIGHT);
        this.player = player;
        this._inGame = true;

        this._updateTurn();
    }

    finish() {
        this._inGame = false;
        this._updateTurn();
    }

    _tileToWorldPos(tile) {
        return Vec3.subtract(Vec3(tile[0], tile[1], 0), this._offset);
    }

    _worldPosToTile(pos) {
        let tile = Vec3.round(Vec3.add(pos, this._offset));
        if (tile[0] < 0 || tile[0] >= BOARD_WIDTH || tile[1] < 0 || tile[1] >= BOARD_HEIGHT) return null;
        return Vec2(tile[0], tile[1]);
    }

    _canvasPosToScreen(pos) {
        return Vec2(
            Maths.map(0, this.canvas.width, -1, 1, pos[0]),
            Maths.map(0, this.canvas.height, 1, -1, pos[1]),
        );
    }

    _canvasPosToWorld(pos) {
        let screenPos = this._canvasPosToScreen(pos);
        return this.camera.screenToWorldPosition(screenPos);
    }

    _onMouseClick(e) {
        if (!this._inGame) return;
        
        let canvasPos = Utils.mousePosOnCanvas(this.canvas, e);
        let worldPos = this._canvasPosToWorld(canvasPos);

        let tile = this._worldPosToTile(worldPos);
        if (tile == null) return;

        this.move(tile[0]);
    }

    _onMessage(type, data) {
        switch(type) {
            case START_GAME: this.start(data); break;
            case MOVE: super.move(this._otherPlayer(this.player), data); break;
            case ABORT: this._onAbort(); break;
            case PONG: clearTimeout(this._disconnectTimeout); break;
        }
    }

    _onPieceAdded(x, y, player) {
        let targetPosition = this._tileToWorldPos(Vec2(x, y));
        targetPosition[2] = BOARD_WIDTH * y + x;

        let startPosition = Vec3(targetPosition[0], targetPosition[1] + 10, targetPosition[2]);

        this.pieces[x][y] = new Piece(this.renderer.gl, this._tileTextures[0], startPosition, targetPosition, player);
        this.checkState();
    }

    _onResize() {
        this.renderer.resize(this._container.offsetWidth, this._container.offsetHeight);
        this.camera.aspectRatio = this._container.offsetWidth / this._container.offsetHeight;
    }

    _onAbort() {
        this.finish();
        this._showFinishScreen('Your opponent chickened out!');
    }

    _isMyTurn() {
        return this._inGame && this.player == this.currentPlayer;
    }

    _update(deltatime) {
        if (this.pieces) {
            for (let y = 0; y < BOARD_HEIGHT; y++) {
                for (let x = 0; x < BOARD_WIDTH; x++) {
                    if (this.pieces[x][y]) this.pieces[x][y].update(deltatime);
                }
            }
        }

        if (this._mousePosition) {
            // Camera movement
            let targetPosition = this._canvasPosToScreen(this._mousePosition);
            targetPosition = Vec3(targetPosition[0], targetPosition[1], 0);
            targetPosition = Vec3.multiply(targetPosition, 0.25);
            this.camera.position = Vec3.lerp(this.camera.position, targetPosition, 10 * deltatime);
            this.camera.position = Vec3(
                Maths.clamp(this.camera.position[0], -1, 1),
                Maths.clamp(this.camera.position[1], -1, 1),
                0
            );

            // Highlighting
            if (!this._isMyTurn()) {
                this._highlightMaterial.opacity = Maths.lerp(this._highlightMaterial.opacity, 0, 0.2);
            } else {
                let tile = this._worldPosToTile(this._canvasPosToWorld(this._mousePosition));
                if (tile) {
                    this._highlightMaterial.highlightX = this._tileToWorldPos(tile)[0];
                    this._highlightMaterial.opacity = Maths.lerp(this._highlightMaterial.opacity, 0.1, 0.2);
                } else {
                    this._highlightMaterial.opacity = Maths.lerp(this._highlightMaterial.opacity, 0, 0.2);
                }
            }
        }
    }

    _render() {
        this.renderer.beginScene();
        this.renderer.clear(0.1, 0.1, 0.1);

        this.renderer.drawQuad(this._wallMaterial, Vec3(0, 0, -100), 0, Vec3(20, 10, 0));

        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                let pos = this._tileToWorldPos(Vec2(x, y));
                pos = Vec3.subtract(pos, Vec3(0, 0.43, 50));
                this.renderer.drawQuad(this._hookMaterial, pos, 0, Vec3(0.4, 0.4, 1));
            }
        }

        if (this.pieces) {
            for (let y = 0; y < BOARD_HEIGHT; y++) {
                for (let x = 0; x < BOARD_WIDTH; x++) {
                    if (this.pieces[x][y]) this.pieces[x][y].render(this.renderer);
                }
            }
        }
        
        this.renderer.drawQuad(this._highlightMaterial, Vec3(0, 0, 0), 0, Vec3(100, 100, 1));

        this.renderer.endScene(this.camera);
    }
}