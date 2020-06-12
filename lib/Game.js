const features = {
//            blue        red        green
    'color': ['#48b0ba', '#ba5d48', '#48ba5f'],
    'shape': ['circle', 'square', 'swoosh'],
    'filling': ['full', 'none', 'mottled'],
    'amount': [1, 2, 3]
}

function setUp() {
    var pile = []
    for (const color of features.color) {
        for (const shape of features.shape) {
        for (const filling of features.filling) {
            for (const amount of features.amount){
            pile.push({
                'color': color,
                'shape': shape,
                'filling': filling,
                'amount': amount
            });
            }
        }
        }
    }
    // Shuffle pile
    let ctr = pile.length;
    let temp;
    let index;
    while (ctr > 0) {
        index = Math.floor(Math.random() * ctr);
        ctr--;
        temp = pile[ctr];
        pile[ctr] = pile[index];
        pile[index] = temp;
    }

    var deck = pile.splice(0, 12);

    return [deck, pile];
}

class Game {
    constructor(name, isPrivate) {
        // the name functions as a id
        this.name = name;
        this.players = [];
        this.pile = [],
        this.deck = [],
        this.gameActive = false;    // TODO: rename in isActive
        this.isPrivate = isPrivate;
    }

    filterJoinable() {
        if(!this.isPrivate && !this.gameActive) {
            return true;
        }
        return false;
    }

    getNumberOfPlayers() {
        return this.players.length;
    }

    getName() {
        return this.name;
    }

    getGameActive() {
        return this.gameActive;
    }

    addPlayer(player) {
        if(player) {
            this.players.push(player);
        }
    }

    startGame() {
        this.gameActive = true;
        [this.deck, this.pile] = setUp();
    }

    removePlayer(id) {
        for(let i = 0; i < this.players.length; i ++) {
            if(this.players[i].getId() === id) {
                this.players.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    getLobbyValues() {
        return {
            numberOfPlayers: Object.keys(this.players).length,
            name: this.name,
            gameActive: this.gameActive,
            numberOfPlayers: this.players.length,
        }
    }

    getInGameValues() {
        return {
            deck: this.deck,
            players: this.players,
            gameActive: this.gameActive,
            deck: this.deck,
            pileLength: this.pile.length,
        }
    }

    _removeSet(cards) {
        if(this.deck.length === 12){
            for(const setCard of cards){
              let idx = this.deck.findIndex(c => JSON.stringify(c) === JSON.stringify(setCard))
              this.deck[idx] = this.pile.pop();
            }
          }
          else {
            this.deck = this.deck.filter(card => !(JSON.stringify(cards).includes(JSON.stringify(card))))
          }
    }

    checkSet(cards) {
        for (const feature in features) {
            let valid = false
            // Not all the same
            if(cards[0][feature] === cards[1][feature] && cards[1][feature] === cards[2][feature]) {
                valid = true
            }
            // Not all different
            if(cards[0][feature] !== cards[1][feature] && cards[0][feature] !== cards[2][feature] && cards[1][feature] !== cards[2][feature]){
                valid = true
            }
            if(!valid){
                return {
                    isSet: false,
                    message: `Failed when checking the ${feature}`,
                };
            }
        }
    
        this._removeSet(cards);
        return {
            isSet: true,
            message: 'Set is valid',
        };
    }

    // getWinner() {
    //     let maxScore = 0;
    //     let listOfWinners = [];
    //     for (const key in this.player) {
    //         if (this.players.hasOwnProperty(key)) {
    //             const player = this.players[key];
    //             const playerScore = player.getScore();
    //             if (playerScore > maxScore) {
    //                 maxScore = playerScore;
    //                 listofWinners = [];
    //                 listofWinners.push({ playerId: player.getId(), name: player.getName() });
    //             }
    //             else if (playerScore === maxScore) {
    //                 listofWinners.push({playerNo: player.playerNo, color: player.paddle.color});
    //             }
    //         }
    //     }
    //     return listOfWinners;
    // }

    addThreeCards() {
        for(let i = 0; i <  3; i ++){
            this.deck.push(this.pile.pop());
        }
    }
}

module.exports = Game;