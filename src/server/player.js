class Player {
    constructor(socketid, username, room){
        this.socketid = socketid;
        this.username = username;
        this.room = room
        this.teamNumber = 0;
    }
}

module.exports = Player;