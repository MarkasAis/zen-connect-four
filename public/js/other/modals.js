export default class Modals {
    static _containerElement = null;
    static _messageElement = null;
    static _buttonsElement = null;

    static init(containerElement, messageElement, buttonsElement) {
        Modals._containerElement = containerElement;
        Modals._messageElement = messageElement;
        Modals._buttonsElement = buttonsElement;
    }

    static _populateButtons(actions={}) {
        while (Modals._buttonsElement.lastElementChild)
            Modals._buttonsElement.removeChild(Modals._buttonsElement.lastElementChild);

        for (let [name, callback] of Object.entries(actions)) {
            let button = document.createElement('button');
            button.innerHTML = name;
            button.addEventListener('click', callback);
            Modals._buttonsElement.appendChild(button);
        }
    }

    static open(message, actions) {
        Modals._messageElement.innerHTML = message;
        Modals._populateButtons(actions);
        Modals._containerElement.classList.remove('fade-out');
        Modals._containerElement.classList.add('fade-in');
    }

    static close() {
        Modals._containerElement.classList.remove('fade-in');
        Modals._containerElement.classList.add('fade-out');
    }
}