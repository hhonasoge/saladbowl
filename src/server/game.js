const Constants = require('../shared/constants');
const Room = require('./room');
const Player = require('./player');

class Game {
    constructor() {
      this.rooms = {}
      this.socketToRooms = {}
    }

    addPlayer(socket, username, roomID) {
        const player = new Player(socket.id, username, roomID);
        if (!(roomID in this.rooms)) {
            this.rooms[roomID] = new Room(roomID)
        }
        const room = this.rooms[roomID];
        room.players[socket.id] = player;
        room.sockets[socket.id] = socket;
        this.socketToRooms[socket.id] = roomID
        socket.join(roomID);
    }

    addPlayerWithTeam(socket, username, roomID, teamNumber) {
        this.addPlayer(socket, username, roomID)
        const room = this.rooms[roomID];
        const player = room.players[socket.id]
        room.addPlayerToTeam(player, teamNumber)
        room.updatePlayerWithTeam(socket, teamNumber)
    }

    removePlayer(socket) {
        if (!(socket.id in this.socketToRooms)) {
            console.log('player does not exist')
            return
        }
        const roomID = this.socketToRooms[socket.id]
        const room = this.rooms[roomID]
        room.removePlayerFromTeam(socket)
        // console.log("SOCKETS: ", this.rooms[roomID].sockets)
        socket.leave(roomID);
        delete this.socketToRooms[socket.id]
        delete this.rooms[roomID].players[socket.id]
        delete this.rooms[roomID].sockets[socket.id]
    }

    handleContinue(socket, roomID) {
        const room = this.rooms[roomID]
        room.pushNewWord(socket)
    }
    
    handleNextWord(socket, roomID) {
        const room = this.rooms[roomID]
        room.incrementScore()
        var word = room.iterateNextWord(socket)
        return word
    }

    handleFinishTurn(socket, roomID) {
        const room = this.rooms[roomID]
        room.incrementTeamIndex()
        room.switchTeams()
        room.pushStartTurn()
    }

    assignTeams(roomID) {
        const room = this.rooms[roomID]
        room.assignTeamsToPlayers()
        room.updatePlayersWithTeam()
    }

    shufflePrompts(roomID) {
        const room = this.rooms[roomID]
        room.shufflePrompts()
    }

    pushStartTurn(roomID) {
        const room = this.rooms[roomID]
        room.pushStartTurn()
        room.setRoomStarted()
    }

    hasStarted(roomID) {
        if (!(roomID in this.rooms)) {
            return false
        }
        const room = this.rooms[roomID]
        return room.hasRoomStarted()
    }   

    addPrompts(roomID, inputs) {
        this.rooms[roomID].prompts = this.rooms[roomID].prompts.concat(inputs.filter((function (val){
            return val !== '';
        })))
    }
}

module.exports = Game;

