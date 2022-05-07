class MatchMaker {
    constructor(playersPerMatch, matchCallback) {
        this.playersPerMatch = playersPerMatch;
        this.matchCallback = matchCallback;

        this.pool = [];
    }

    addPlayer(player) {
        if (this.pool.indexOf(player) !== -1) return;
        this.pool.push(player);

        if (this.pool.length >= this.playersPerMatch) {
            let players = this.pool.splice(0, this.playersPerMatch);
            this.matchCallback(players);
        }
    }

    removePlayer(player) {
        let index = this.pool.indexOf(player);
        if (index !== -1) this.pool.splice(index, 1);
    }
}

export default MatchMaker;