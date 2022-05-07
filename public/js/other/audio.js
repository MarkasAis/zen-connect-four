export default class AudioLibrary {
    static _library = {};

    static load(name, url) {
        this._library[name] = new Audio(url);
    }

    static play(name, { volume=1, loop=false, delay=0 }) {
        let audio = AudioLibrary._library[name];
        if (!audio) return;

        setTimeout(() => {
            audio = audio.cloneNode(true);
            audio.volume = volume;
            audio.loop = loop;

            let attemptToPlay = () => {
                audio.play().catch(() => {
                    setTimeout(attemptToPlay, 1000);
                });
            }

            attemptToPlay();
        }, delay);
    }
}