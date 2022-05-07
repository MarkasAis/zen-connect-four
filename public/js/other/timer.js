export default class Timer {
    constructor(frameCallback) {
        this._frameCallback = frameCallback;
        this._frameID = null;
        this._lastTime = null;
    }

    start() {
        this._lastTime = null;
        this._frameID = requestAnimationFrame((t) => { this._onFrame(t); });
    }

    stop() {
        cancelAnimationFrame(this._frameID);
    }

    _onFrame(time) {
        let deltaTime = this._lastTime != null ? (time - this._lastTime) / 1000 : 0;
        this._lastTime = time;

        if (deltaTime > 1) deltaTime = 0; 

        this._frameCallback(deltaTime);
        this._frameID = requestAnimationFrame((t) => { this._onFrame(t); });
    }
}