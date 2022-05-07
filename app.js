import express from 'express';
import path from 'path';
import http from 'http';
import { WebSocketServer } from 'ws';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

import MatchMaker from './lib/matchmaking.js';
import ConnectFourServer from './lib/server.js';

import indexRouter from './routes/index.js';
import { JOIN_QUEUE, PING, PONG } from './public/js/other/messages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = process.env.PORT || 3000;
const app = express();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get("/play", indexRouter);
app.get("/", indexRouter);

app.use('/favicon.ico', express.static('public/images/favicon.ico'));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const mm = new MatchMaker(2, players => {
    for (let p of players) p.inGame = true;
    let game = new ConnectFourServer(players, () => {
        for (let p of players) p.inGame = false;
        game.delete();
    });
});

wss.on('connection', ws => {
    ws.on('message', data => {
        let m = JSON.parse(data);
        if (m.type == JOIN_QUEUE && !ws.inGame) mm.addPlayer(ws);
        if (m.type == PING) ws.send(JSON.stringify({ type: PONG }));
    });

    ws.on('close', code => {
        mm.removePlayer(ws);
    });
});

server.listen(port);