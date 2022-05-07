import express from "express";
import StatTracker from "../lib/stats.js";
var router = express.Router();

router.get("/", function(req, res) {
  res.render("splash.ejs", {
    gamesStarted: StatTracker.gamesStarted,
    gamesWon: StatTracker.gamesWon,
    gamesTied: StatTracker.gamesTied
  });
});

router.get('/play', (req, res) => {
  res.sendFile("game.html", { root: "./public" });
});

export default router;
