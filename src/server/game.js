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
            console.log("room does not exist, creating new room: ", roomID)
            this.rooms[roomID] = new Room(roomID)
        }
        console.log(`adding new player to room: player: ${username}, roomID: ${roomID}, socket: ${socket}`)
        const room = this.rooms[roomID];
        if (!roomID) {
            console.log('unable add player. room is undefined')
            return
        }
        room.players[socket.id] = player;
        room.sockets[socket.id] = socket;
        this.socketToRooms[socket.id] = roomID
        socket.join(roomID);
    }

    addPlayerWithTeam(socket, username, roomID, teamNumber) {
        console.log(`adding new player to room with team: player: ${username}, roomID: ${roomID}, socket: ${socket}, teamNumber: ${teamNumber}`)
        this.addPlayer(socket, username, roomID)
        const room = this.rooms[roomID];
        if (!roomID) {
            console.log('unable add player to team. room is undefined')
            return
        }
        const player = room.players[socket.id]
        if (!player) {
            console.log('unable add player to team. player is undefined')
            return
        }
        room.addPlayerToTeam(player, teamNumber)
        room.updatePlayerWithTeam(socket, teamNumber)
    }

    hasEnoughPlayers(roomID) {
        return Object.keys(this.rooms[roomID].players).length >= 2
    }

    removePlayer(socket) {
        console.log('removing player')
        if (!(socket.id in this.socketToRooms)) {
            console.log('player does not exist')
            return
        }
        const roomID = this.socketToRooms[socket.id]
        const room = this.rooms[roomID]
        room.removePlayerFromTeam(socket)
        socket.leave(roomID);
        delete this.socketToRooms[socket.id]
        delete this.rooms[roomID].players[socket.id]
        delete this.rooms[roomID].sockets[socket.id]
        if (room.isEmpty()) {
            delete this.rooms[roomID]
        }
    }

    handleContinue(socket, roomID) {
        console.log('continuing...')
        const room = this.rooms[roomID]
        if (!roomID) {
            console.log('unable to continue. room is undefined')
            return
        }
        room.shufflePrompts()
        room.pushNewWord(socket)
    }
    
    handleNextWord(socket, roomID) {
        console.log('handling next word')
        const room = this.rooms[roomID]
        if (!roomID) {
            console.log('unable handle next word. room is undefined')
            return
        }
        room.incrementScore()
        const player = room.players[socket.id]
        if (!player) {
            console.log('cannot update personal score, player is null')
        } else {
            player.score++
        }
        var word = room.iterateNextWord(socket)
        room.updatePlayersWithGameInfo()
        return word
    }

    handleFinishTurn(socket, roomID) {
        console.log('handling finish turn')
        const room = this.rooms[roomID]
        room.incrementTeamIndex()
        room.switchTeams()
        room.pushStartTurn()
        room.updatePlayersWithGameInfo()
    }

    assignTeams(roomID) {
        console.log('assigning teams')
        const room = this.rooms[roomID]
        if (!roomID) {
            console.log('unable to assign teams. room is undefined')
            return
        }
        room.assignTeamsToPlayers()
        room.updatePlayersWithGameInfo()
    }

    shufflePrompts(roomID) {
        const room = this.rooms[roomID]
        if (!roomID) {
            console.log('unable to shuffle prompts. room is undefined')
            return
        }
        room.shufflePrompts()
    }

    pushStartTurn(roomID) {
        console.log('starting turn')
        const room = this.rooms[roomID]
        if (!roomID) {
            console.log('unable to push start turn. room is undefined')
            return
        }
        room.pushStartTurn()
        room.setRoomStarted()
    }

    hasStarted(roomID) {
        if (!(roomID in this.rooms)) {
            return false
        }
        const room = this.rooms[roomID]
        if (!roomID) {
            console.log('failed to get hasStarted. room is undefined')
            return
        }
        return room.hasRoomStarted()
    }   

    addPrompts(roomID, inputs) {
        console.log(`adding prompts to room: ${roomID}`, roomID)
        this.rooms[roomID].prompts = this.rooms[roomID].prompts.concat(inputs.filter((function (val){
            return val !== '';
        })))
    }
}

module.exports = Game;

