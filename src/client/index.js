import io from 'socket.io-client';
import './main.css';
import 'jquery';
import 'bootstrap/dist/css/bootstrap.min.css';

const shortid = require('shortid');

const Constants = require('../shared/constants');
const createRoomButton = document.getElementById('create-room');
const usernameInput = document.getElementById('username-input');
const roomID = document.getElementById('roomID')
const gameIDName = 'game-background'
const gameID = '#game-background'
const infoModalID = '#info-modal'

const socketProtocol = (window.location.protocol.includes('https')) ? 'wss' : 'ws';
const socket = io(`${socketProtocol}://${window.location.host}`, { reconnection: false });
const connectedPromise = new Promise(resolve => {
    socket.on('connect', () => {
      console.log('Connected to server!');
      resolve();
    });
  });

  export const connect = onGameOver => (
    connectedPromise.then(() => {
      // Register callbacks
      socket.on(Constants.MSG_TYPES.GAME_COMPLETE, onGameOver);
      socket.on(Constants.MSG_TYPES.GAME_INFO, renderGameInfoModal)
      socket.on(Constants.MSG_TYPES.SERVER_PUSH_WORD, renderWord)
      socket.on(Constants.MSG_TYPES.NEXT_TURN, renderWhoIsUpNextScreen)
      socket.on(Constants.MSG_TYPES.ROUND_COMPLETE, renderRoundComplete)
      socket.on('disconnect', () => {
        console.log('Disconnected from server.');
        document.getElementById('disconnect-modal').classList.remove('hidden');
        document.getElementById('reconnect-button').onclick = () => {
          window.location.reload();
        };
      });
    })
  );

Promise.all([
    connect(onGameOver),
]).then(() => {
$("#play-button").click(() => {
    console.log(`${socketProtocol}://${window.location.host}`)
    if ($('#username-input').val().trim().length == 0) {
        alert("you gotta enter a legit username ok")
        return
    }
    if ($('#roomID').val().trim().length == 0) {
        alert("you gotta enter a legit room ID ok")
        return
    }
    play(usernameInput.value, roomID.value);
});
createRoomButton.onclick = () => {
    var roomClass = document.getElementsByClassName('createRoomClass')
    createRoomButton.classList.add("hidden")
    var textElement = document.createElement("p")
    textElement.innerHTML = 'Your room code is: ' + shortid() + ". Share it with the rest of the game players"
    roomClass[0].appendChild(textElement)

};
}).catch(console.error)

function onGameOver(update) {
    console.log("game is over")
    $(gameID).empty()
    $("<p/>", {
        html: `The game is complete. Final score. Team 1: ${update.team1Score} Team 2: ${update.team2Score}`
    }).appendTo(gameID)
  }

  export function renderRoundComplete(update) {
    $(gameID).empty()
    $("<p/>", {
        html: `The round is complete. Score so far: Team 1: ${update.team1Score} Team 2: ${update.team2Score}`
    }).appendTo(gameID)
    $("<button/>", {
        html: 'Continue to next round',
        click: function() {
            socket.emit(Constants.MSG_TYPES.CONTINUE)
        }
    }).appendTo(gameID)
  }

export function renderWord(update) {
    console.log('renderWord invoked')
    $(gameID).empty()
    $("<p/>", {
        html: "It's your turn. Click the Start button when you're ready!"
    }).appendTo(gameID)
    $("<button/>", {
        id: 'word-button',
        html: "Start",
        click: function() {
            $("<p/>", {
                id: 'word-text',
                html: `Here's your word: ${update.word}`

            }).appendTo(gameID)
            $('#word-button').hide();
            $('<button/>', {
                html: 'Next',
                click: function(){
                    socket.emit(Constants.MSG_TYPES.NEXT_WORD, function(data) {
                        $('#word-text').html("Here's your word: " + data)
                    })
                }
            }).appendTo(gameID)
            $('<button/>', {
                html: 'Done with turn',
                click: function(){
                    socket.emit(Constants.MSG_TYPES.FINISH_TURN)
                }
            }).appendTo(gameID)
        }
    }).appendTo(gameID)
}

export function renderGameInfoModal(update) {
    console.log('renderGameInfoModal invoked')
    $(infoModalID).empty()

    var modalList = $('<ul/>').css('list-style', 'none').append(
        $(`<li>Your Team Number: ${update.team}</li>`),
        $(`<li>Team 1 Score: ${update.team1Score}</li>`),
        $(`<li>Team 2 Score: ${update.team2Score}</li>`),
        $(`<li>Personal Score: ${update.personalScore}</li>`),
        $(`<li>Room ID: ${update.room}</li>`),
        $(`<li>Round: ${update.round}</li>`),
        $(`<li>Your Username: ${update.username}</li>`)
    ).appendTo(infoModalID)
}

export function renderWhoIsUpNextScreen(update) {
    $(gameID).empty()
    $('<h1/>', {
        html: `It's ${update.currPlayerName}'s turn`
    }).appendTo(gameID)
    let nextPlayerText = `${update.nextPlayerName} is up next`
    if (update.nextPlayerName === update.username) {
        nextPlayerText = `You're up next!`
    }
    $('<h2/>', {
        html: nextPlayerText
    }).appendTo(gameID)
}

export function renderHasStartedScreen() {
     // the code below is really bad. need to refactor this
     var gameBackground = document.getElementById(gameIDName)
     gameBackground.innerHTML = ''
     
     var instructionsText = document.createElement("strong")
     instructionsText.innerHTML = "This game has already started"
     var userName = document.createElement("input")
     userName.id = "userName"
     userName.type = "text"
     userName.placeholder = "What was your user name?"
     var teamNumber = document.createElement("input")
     teamNumber.id = "teamNumber"
     teamNumber.type = "text"
     teamNumber.placeholder = "What team were you?" 
     var roomID = document.createElement("input")
     roomID.id = "roomID"
     roomID.type = "text"
     roomID.placeholder = "roomID"
     var submitButton = document.createElement("button")
     submitButton.innerHTML="Submit"
     submitButton.onclick = () => {
        const userName = document.getElementById('userName');
        const teamNumber = document.getElementById('teamNumber');
        if (userName.value.trim().length == 0) {
            alert("you gotta enter a legit username ok")
            return
        }
        if (teamNumber.value.trim().length == 0 || isNaN(teamNumber.value)) {
            alert("you gotta enter a legit room ID ok")
            return
        }
        socket.emit(Constants.MSG_TYPES.JOIN_GAME_WITH_TEAM, usernameInput.value, roomID.value, parseInt(teamNumber.value))
     }
     gameBackground.appendChild(instructionsText)
     gameBackground.appendChild(userName)
     gameBackground.appendChild(teamNumber)
     gameBackground.appendChild(roomID)
     gameBackground.appendChild(submitButton)
}

export function renderInputScreen() {
    $(gameID).empty()
    $("<p/>", {
        html: "Think of 3-5 prompts and submit them below. Write anything just please be funny, like don't be boring ok."
    }).appendTo(gameID)
    for (let i = 0; i < 5; i++) {
        $("<input/>", {
            id: "input"+i,
            placeholder: "Write anything",
            type: "text",
        }).appendTo(gameID)
    }
    $("<button/>", {
        html: "Submit",
        click: function() {
            const input1 = $('#input0').val();
            const input2 = $('#input1').val();
            const input3 = $('#input2').val();
            const input4 = $('#input3').val();
            const input5 = $('#input4').val();
            submitWords(input1, input2, input3, input4, input5);
            renderReadyButton()
        }
    }).appendTo(gameID)
}

export const renderReadyButton = () => {
    $(gameID).empty()
    $("<strong/>", {
        html: "Only click this when everyone playing the game has submitted. Otherwise you'll mess everything up ok"
    }).appendTo(gameID)
    $("<br/>").appendTo(gameID)
    $("<button/>", {
        html: "Everyone's ready",
        style: {
            margin: "50px"
        },
        click: function() {
            startGame()
        }
    }).appendTo(gameID)
}

export const startGame = () => {
    socket.emit(Constants.MSG_TYPES.START_GAME, function(isValid, reason){
        if (!isValid) {
            alert(reason)
        }
    })
}

export const submitWords = (input1, input2, input3, input4, input5) => {
    socket.emit(Constants.MSG_TYPES.SUBMIT_WORDS, [input1, input2, input3, input4, input5]);
}

export const play = (usernameInput, roomID) => {
    socket.emit(Constants.MSG_TYPES.JOIN_GAME, usernameInput, roomID, function(hasStarted){
        if (hasStarted) {
            renderHasStartedScreen()
        }
    });
    renderInputScreen();
};