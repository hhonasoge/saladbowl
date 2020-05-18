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

    isPlayersTurn(player) {
        var teamNumber =  player.teamNumber
        if (teamNumber !== this.currentTeam) {
            return false
        }
        if (teamNumber === 1) {
            console.log("this.team1 ", this.team1)
            console.log("this.team1 index ", this.team1Index)
            console.log("this.team1[this.team1Index]: ", this.team1[this.team1Index])
            console.log("this.team1[this.team1Index].socketid: ", this.team1[this.team1Index].socketid)
            console.log("player: ", player)
            console.log("player.socketid: ", player.socketid)
            console.log("this.team2 ", this.team1)
            console.log("this.team2 ", this.team2Index)
            return this.team1[this.team1Index].socketid === player.socketid
        }
        if (teamNumber === 2) {
            return this.team2[this.team2Index].socketid === player.socketid
        }
    }

    removePlayerFromTeam(socket) {
        for (var i = 0; i < this.team1.length; i++) {
            console.log("I: ", i)
            if (this.team1[i].socketid === socket.id) {
                this.team1.splice(i, 1)
                if (this.team1Index === this.team1.length) {
                    this.team1Index = 0
                }
                this.pushStartTurn()
                return
            }
        }
        for (var i = 0; i < this.team2.length; i++) {
            if (this.team2[i].socketid === socket.id) {
                this.team2.splice(i, 1)
                if (this.team2Index === this.team2.length) {
                    this.team2Index = 0
                }
                this.pushStartTurn()
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
        if (this.currentPromptIndex  == this.prompts.length-1) {
            // we're at the end of the list
            if (this.currentRound == 3) {
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
        if (this.currentTeam == 1) {
            const currPlayer = this.team1[this.team1Index]
            const socket = this.sockets[currPlayer.socketid]
            this.pushNewWord(socket)
        } else {
            const currPlayer = this.team2[this.team2Index]
            const socket = this.sockets[currPlayer.socketid]
            this.pushNewWord(socket)
        }
    }

    pushNewWord(socket) {
        if (socket) {
            socket.emit(Constants.MSG_TYPES.SERVER_PUSH_WORD, {
                word: this.prompts[this.currentPromptIndex]
            })
        }
    }

    updatePlayersWithTeam() {
        Object.keys(this.sockets).forEach(socketID => {
            const socket = this.sockets[socketID];
            const teamNumber = this.players[socketID].teamNumber
            this.updatePlayerWithTeam(socket, teamNumber)
        })
    }

    updatePlayerWithTeam(socket, teamNumber) {
        socket.emit(Constants.MSG_TYPES.TEAM_NUMBER, {team: teamNumber})
    }
}

module.exports = Room;