const socketServer = require('socket.io');
const http = require('http');
const express = require('express');
const cors = require('cors');
const Player = require('./lib/Player');
const Game = require('./lib/Game');

const app = express();
app.use(cors);
app.options('*', cors());

var server = http.createServer(app);
var io = socketServer(server);

var games = [];     // All ongoing games
var players = {};   // All connected sockets

// Code from https://github.com/jennarim/Four-Player-Pong-Online/blob/master/src/server/app.js
function getGameByName(gameName) {
    for(const game of games) {
        if (game.getName() === gameName) {
            return game;
        }
    }
    return null;
}

function getCurrentGameOfSocket(socket) {
    var allRooms = []
    for(var room in socket.rooms){
        if(room !== socket.id)
            allRooms.push(room);
    }
    if(allRooms.length === 1) {
        return getGameByName(allRooms[0])
    }
    else {
        return null;
    }
}

function getLobbyGames() {
    return games.filter(g => g.filterJoinable()).map(g => g.getLobbyValues());
}

io.on('connection', (socket) => {
    console.log("connected : " + socket.id);

    players[socket.id] = new Player(socket.id);

    socket.emit('connected', { "id": socket.id });

    socket.on('disconnect', () => {
        console.log(`${socket.id} got disconnect!`);
        if (socket.id && socket.id in players) {
            // Get game socket was part in
            for(let i = 0; i < games.length; i ++){
                if(games[i].removePlayer(socket.id)) {
                    console.log(`Deleting ${socket.id} from ${games[i].getName()}`)
                    if(games[i].getNumberOfPlayers() === 0){
                        console.log(`Removing game ${games[i].getName()}`)
                        games.splice(i, 1);
                    }
                }
            }
            delete players[socket.id];
            socket.broadcast.emit('games', getLobbyGames());
        }
     });

    socket.on('getAllGames', () => {
        console.log(`socket ${socket.id} is getting all games.`);
        if(games){
            socket.emit('games', getLobbyGames());
        }
    });

    socket.on('getGame', () => {
        const curr_game = getCurrentGameOfSocket(socket);
        if(curr_game) {
            console.log(`socket ${socket.id} is getting their game: ${curr_game.getName()}.`);
            socket.emit('gameValues', curr_game.getInGameValues());
        }
    })

    socket.on('createNewGame', data => {
        if(!data.name) {console.log('Trying to create nameless game ;('); return; }
        if(!data.isPrivate) { data.isPrivate = false }
        console.log(`socket ${socket.id} is creating a new game ${data.name}`);
        if (games) {
            for(const game of games) {
                if (game.getName() === data.name) {
                    console.log('Names should be unique!')
                    return;
                }
            }
            games.push(new Game(data.name, data.isPrivate));
            socket.broadcast.emit('games', games.map(g => g.getLobbyValues()));
            socket.emit('games', getLobbyGames());
        }
    });

    socket.on('joinGame', data => {
        if(data && players[socket.id].getName() !== ''){
            const gameToJoin = getGameByName(data)
            if(gameToJoin && !(gameToJoin.getGameActive())) {
                gameToJoin.addPlayer(players[socket.id]);

                socket.join(gameToJoin.getName(), () => {
                    console.log(`socket ${socket.id} is joining game / room ${gameToJoin.getName()}.`);;
                });

                socket.in(gameToJoin.getName()).emit('gameValues', gameToJoin.getInGameValues());
                socket.emit('gameValues', gameToJoin.getInGameValues());
                socket.broadcast.emit('games', getLobbyGames());
            }
        }
    });

    socket.on('startGame', () => {
        console.log('reached server');
        const curr_game = getCurrentGameOfSocket(socket);
        if(curr_game) {
            curr_game.startGame();
            socket.in(curr_game.getName()).emit('gameValues', curr_game.getInGameValues());
            socket.emit('gameValues', curr_game.getInGameValues());
        }
    })

    socket.on('setName', data => {
        if(data) {
            console.log(`socket ${socket.id} is setting their name to: ${data}`);
            players[socket.id].setName(data);
        }
    });

    socket.on('getInGameValues', () => {
        if(getCurrentGameOfSocket(socket)) {
            console.log(`socket ${socket.id} is getting the game values of game ${getCurrentGameOfSocket(socket).getName()}`);
            socket.emit('gameValues', getCurrentGameOfSocket(socket).getInGameValues());
        }
    });

    socket.on('getGameState', () => {
        let gameState = {
            message: 'Wait for players to join or start game.',
            status: 'start'
        }
        socket.emit('gameState', gameState);
    })

    socket.on('addThreeCards', () => {
        const curr_game = getCurrentGameOfSocket(socket);
        if(curr_game) {
            console.log(`socket ${socket.id} is adding three cards to game ${curr_game.getName()}`);
            curr_game.addThreeCards();
            socket.in(curr_game.getName()).emit('gameValues', curr_game.getInGameValues());
            socket.emit('gameValues', curr_game.getInGameValues());
        }
    });

    socket.on('claimSet', data => {
        const curr_game = getCurrentGameOfSocket(socket);
        if(curr_game && data) {
            console.log(`socket ${socket.id} is claiming a set in game ${curr_game.getName()}`);
            setIsValid = curr_game.checkSet(data);
            if(setIsValid.isSet){
                // Set is valid
                console.log('It was valid.');
                players[socket.id].incrScore();

                socket.in(curr_game.getName()).emit('gameValues', curr_game.getInGameValues());
                socket.emit('gameValues', curr_game.getInGameValues());

                socket.in(getCurrentGameOfSocket(socket).getName()).emit('gameState', {
                    status: '',
                    message: `Player ${players[socket.id].getName()} entered a valid Set.`
                });
                socket.emit('gameState', {
                    status: 'setSuccess',
                    message: setIsValid.message,
                });
            }
            else {
                // Set is not valid
                console.log('It was not valid.');
                socket.emit('gameValues', curr_game.getInGameValues());
                // Add some penalty here
                socket.emit('gameState', {
                    status: 'setFailed',
                    message: setIsValid.message,
                });
                socket.in(getCurrentGameOfSocket(socket).getName()).emit('gameState', {
                    status: '',
                    message: `Player ${players[socket.id].getName()} entered a nonvalid Set.`
                });
            }
        }
    });

});

const port = 8000;
io.listen(port);
console.log('listening on port ', port);