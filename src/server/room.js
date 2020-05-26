const Constants = require('../shared/constants');

class Room {
    constructor(roomID) {
        this.id = roomID;
        this.hasStarted = false
        this.prompts = [];
        this.players = {};
        this.sockets = {};
        this.team1Score = 0;
        this.team2Score = 0;
        this.team1 = [];
        this.team2 = [];
        this.team1Index=0;
        this.team2Index=0;
        this.currentPromptIndex=0;
        this.currentTeam=1;
        this.currentRound=1;
    }

    shufflePrompts() {
        this.prompts.sort(() => Math.random() - 0.5);
    }

    isEmpty() {
        return this.team1.length == 0 && this.team2.length == 0 && Object.keys(this.players).length == 0 && Object.keys(this.sockets).length == 0
    }

    removePlayerFromTeam(socket) {
        for (var i = 0; i < this.team1.length; i++) {
            if (this.team1[i].socketid === socket.id) {
                this.team1.splice(i, 1)
                if (this.team1Index === this.team1.length) {
                    this.team1Index = 0
                }
                if (this.team1.length > 0) {
                    this.pushStartTurn()
                }
                return
            }
        }
        for (var i = 0; i < this.team2.length; i++) {
            if (this.team2[i].socketid === socket.id) {
                this.team2.splice(i, 1)
                if (this.team2Index === this.team2.length) {
                    this.team2Index = 0
                }
                if (this.team2.length > 0) {
                    this.pushStartTurn()
                }
                return
            }
        }
    }


    incrementTeamIndex() {
        if (this.currentTeam === 1) {
            if (this.team1Index === this.team1.length-1) {
                this.team1Index=0
            } else {
                this.team1Index++
            }
        } else {
            if (this.team2Index === this.team2.length-1) {
                this.team2Index=0
            } else {
                this.team2Index++
            }
        }
    }

    iterateNextWord(socket) {
        if (this.currentPromptIndex === this.prompts.length-1) {
            // we're at the end of the list
            if (this.currentRound === 3) {
                // game is done
                Object.keys(this.sockets).forEach(socketID => {
                    const socket = this.sockets[socketID];
                    socket.emit(Constants.MSG_TYPES.GAME_COMPLETE, {team1Score: this.team1Score, team2Score: this.team2Score})
                })
                return ""
            }
            this.currentRound++
            this.currentPromptIndex=0
            socket.emit(Constants.MSG_TYPES.ROUND_COMPLETE, {team1Score: this.team1Score, team2Score: this.team2Score})
            return ""
        }
        this.currentPromptIndex++
        return this.prompts[this.currentPromptIndex]
    }

    incrementScore() {
        if (this.currentTeam == 1) {
            this.team1Score++
        } else {
            this.team2Score++
        }
    }

    switchTeams() {
        if (this.currentTeam == 1) {
            this.currentTeam = 2
        } else {
            this.currentTeam = 1
        }
    }

    addPlayerToTeam(player, teamNumber) {
        if (teamNumber == 1) {
            this.team1.push(player)
            return
        }
        this.team2.push(player)
    }

    setRoomStarted() {
        this.hasStarted = true
    }

    hasRoomStarted() {
        return this.hasStarted
    }

    assignTeamsToPlayers() {
        let team1 = []
        let team2 = []
        Object.values(this.players).forEach(function(player, index) {
            // set team number to 1 or 2
            if ((index%2)==0){
                player.teamNumber = 1
                team1.push(player)
            } else {
                player.teamNumber = 2
                team2.push(player)
            }   
        })
        this.team1=this.team1.concat(team1)
        this.team2=this.team2.concat(team2)
    }

    pushStartTurn() {
        console.log("starting turn")
        if (this.currentTeam === 1) {
            const currPlayer = this.team1[this.team1Index]
            if (!currPlayer) {
                console.log("unable to push start turn. currPlayer is undefined")
                return
            }
            const socket = this.sockets[currPlayer.socketid]
            this.pushNewWord(socket)
        } else {
            const currPlayer = this.team2[this.team2Index]
            if (!currPlayer) {
                console.log("unable to push start turn. currPlayer is undefined")
                return
            }
            const socket = this.sockets[currPlayer.socketid]
            this.pushNewWord(socket)
        }
    }

    pushNewWord(socket) {
        if (!socket) {
            console.log("can't push new word, socket is null")
            return
        }
        socket.emit(Constants.MSG_TYPES.SERVER_PUSH_WORD, {
            word: this.prompts[this.currentPromptIndex]
        })
    }

    updatePlayersWithGameInfo() {
        Object.keys(this.sockets).forEach(socketID => {
            const socket = this.sockets[socketID];
            this.updatePlayerWithGameInfo(socket)
        })
    }

    updatePlayerWithGameInfo(socket) {
        if (!socket) {
            console.log("cannot update player, socket is null")
            return
        }
        const player = this.players[socket.id]
        if (!player) {
            console.log("can't update player, player is null")
            return
        }
        socket.emit(Constants.MSG_TYPES.GAME_INFO, 
            {
                username: player.username,
                room: player.room,
                team: player.teamNumber,
                personalScore: player.score,
                team1Score: this.team1Score,
                team2Score: this.team2Score,
                round: Constants.ROUND[this.currentRound]
            }
        )
    }

    updatePlayersWithNextPlayerInfo() {
        Object.keys(this.sockets).forEach(socketID => {
            const socket = this.sockets[socketID];
            console.log("SOCKET ID: ", socketID)
            console.log("SOCKETS: ", this.sockets)
            this.updatePlayerWithNextPlayerInfo(socket)
        })
    }

    updatePlayerWithNextPlayerInfo(socket) {
        if (!socket) {
            console.log("cannot update player with team info, socket is null")
            return
        }
        const player = this.players[socket.id]
        if (!player) {
            console.log("can't update player with team info, player is null")
            return
        }
        let currPlayerName = this.team1[this.team1Index].username
        let nextPlayerName = this.team2[this.team2Index].username
        if (this.currentTeam === 2) {
            let tmp = currPlayerName
            currPlayerName = nextPlayerName
            nextPlayerName = tmp
        }
        console.log(`updating player with next player info: 
        username: ${player.username}, currPlayerName: ${currPlayerName}, nextPlayerName: ${nextPlayerName}, currTeam: ${this.currentTeam}, nextTeam: ${nextTeam}`)
        socket.emit(Constants.MSG_TYPES.NEXT_TURN, 
            {
                username: player.username,
                currPlayerName: currPlayerName,
                nextPlayerName: nextPlayerName,
                currTeam: this.currentTeam,
                nextTeam: (this.currentTeam === 1) ? 2: 1
            }
        )
    }

}

module.exports = Room;