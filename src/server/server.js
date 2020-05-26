const path = require('path');
const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const socketio = require('socket.io');
const webpackConfig = require('../../webpack.dev.js');
const Constants = require('../shared/constants');
const Game = require('./game');

const app = express();
app.use(express.static('public'));

if (process.env.NODE_ENV === 'development') {
    // Setup Webpack for development
    const compiler = webpack(webpackConfig);
    app.use(webpackDevMiddleware(compiler));
    app.use(express.static('public/assets'));
} else {
    // Static serve the dist/ folder in production
    app.use(express.static('dist'));
}

// Listen on port
const port = process.env.PORT || 3001;
const server = app.listen(port);
console.log(`Server listening on port ${port}`);

// Setup socket.io
const io = socketio(server, {pingTimeout: 60000});

// Listen for socket.io connections
io.on('connection', socket => {
    console.log('Player connected!', socket.id);
    socket.on(Constants.MSG_TYPES.JOIN_GAME, handleJoinGame);
    socket.on(Constants.MSG_TYPES.JOIN_GAME_WITH_TEAM, handleJoinGameWithTeam);
    socket.on(Constants.MSG_TYPES.SUBMIT_WORDS, handleSubmitPrompts);
    socket.on(Constants.MSG_TYPES.START_GAME, startGameInRoom);
    socket.on(Constants.MSG_TYPES.NEXT_WORD, handleNextWord);
    socket.on(Constants.MSG_TYPES.FINISH_TURN, handleFinishTurn);
    socket.on(Constants.MSG_TYPES.CONTINUE, handleContinue);
    socket.on('disconnect', onDisconnect);
});

const game = new Game();

function onDisconnect() {
    game.removePlayer(this);
}

function handleContinue() {
    roomID = game.socketToRooms[this.id]
    if (!roomID) {
        console.log('unable to continue. room is undefined')
        return
    }
    game.handleContinue(this, roomID)
}

function handleFinishTurn() {
    roomID = game.socketToRooms[this.id]
    if (!roomID) {
        console.log('unable to finish turn. room is undefined')
        return
    }
    game.handleFinishTurn(this, roomID)
}

function handleNextWord(fn) {
    roomID = game.socketToRooms[this.id]
    if (!roomID) {
        console.log('unable to handle next word. room is undefined')
        return
    }
    var word = game.handleNextWord(this, roomID)
    if (word !== "") {
        fn(word)
    }
}

function startGameInRoom(fn) {
    roomID = game.socketToRooms[this.id]
    if (!roomID) {
        console.log('unable to start game in room. room is undefined')
        return
    }
    if (!game.hasEnoughPlayers(roomID)) {
        fn(false, 'The game needs at least 2 players')
        return
    }
    game.assignTeams(roomID)
    game.shufflePrompts(roomID)
    game.pushStartTurn(roomID)
    fn(true, '')
}

function handleSubmitPrompts(inputs) {
    roomID = game.socketToRooms[this.id]
    if (!roomID) {
        console.log('unable to submit prompts. room is undefined')
        return
    }
    game.addPrompts(roomID, inputs)
}

function handleJoinGameWithTeam(username, roomID, teamNumber) {
    game.addPlayerWithTeam(this, username, roomID, teamNumber)
}

function handleJoinGame(username, roomID, fn) {
    roomID = roomID.trim()
    if (game.hasStarted(roomID)) {
        fn(true)
        return
    }
    fn(false)
    game.addPlayer(this, username, roomID)
}
