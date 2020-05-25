import io from 'socket.io-client';
import './main.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const shortid = require('shortid');

const Constants = require('../shared/constants');
const playButton = document.getElementById('play-button');
const createRoomButton = document.getElementById('create-room');
const usernameInput = document.getElementById('username-input');
const roomID = document.getElementById('roomID')
const gameClassName = 'game-background'
const infoModalClassName = 'info-modal'

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
    const element = document.createElement('div');
    const CoolBackground = new Image();
    element.src = CoolBackground;
    document.body.appendChild(element);

playButton.onclick = () => {
    console.log(`${socketProtocol}://${window.location.host}`)
    // Play!
    if (usernameInput.value.trim().length == 0) {
        alert("you gotta enter a legit username ok")
        return
    }
    if (roomID.value.trim().length == 0) {
        alert("you gotta enter a legit room ID ok")
        return
    }
    play(usernameInput.value, roomID.value);
};
createRoomButton.onclick = () => {
    var roomClass = document.getElementsByClassName('createRoomClass')
    createRoomButton.classList.add("hidden")
    var textElement = document.createElement("p")
    textElement.innerHTML = 'Your room code is: ' + shortid() + ". Share it with the rest of the game players"
    roomClass[0].appendChild(textElement)

};
}).catch(console.error)


function updateGameWithText(text, elementType) {
    var background = document.getElementsByClassName(gameClassName)[0]
    background.innerHTML=''
    const textElement = document.createElement(elementType)
    textElement.innerHTML = text
    background.appendChild(textElement)
}

function onGameOver(update) {
    console.log("game is over")
    updateGameWithText('The game is complete. Final score. Team 1: ' + update.team1Score + " Team 2: " + update.team2Score, "p")
  }

  export function renderRoundComplete(update) {
    var body = document.getElementsByClassName(gameClassName)[0]
    body.innerHTML=''
    const roundCompleteText = document.createElement("p")
    roundCompleteText.innerHTML = 'The round is complete. Score so far: Team 1: ' + update.team1Score + " Team 2: " + update.team2Score
    body.appendChild(roundCompleteText)
    const continueButton = document.createElement("button")
    continueButton.innerHTML = 'Continue to next round'
    continueButton.onclick = () => {
        socket.emit(Constants.MSG_TYPES.CONTINUE)
    }
    body.appendChild(roundCompleteText)
    body.appendChild(continueButton)
  }

export function renderWord(update) {
    console.log('renderWord invoked')
    var body = document.getElementsByClassName(gameClassName)[0]
    body.innerHTML=''
    const readyText = document.createElement("p")
    readyText.innerHTML = "It's your turn. Click the Start button when you're ready!"
    const wordTextButton = document.createElement("button")
    wordTextButton.innerHTML = 'Start'
    wordTextButton.onclick = () => {
        const shownWork = document.createElement("p")
        shownWork.innerHTML="Here's your word: " + update.word
        body.appendChild(shownWork)
        wordTextButton.style.visibility= 'hidden';
        const gotWordButton = document.createElement("button")
        const finishTurnButton = document.createElement("button")
        gotWordButton.innerHTML = 'Next'
        finishTurnButton.innerHTML = 'Done with turn'
        gotWordButton.onclick = () => {
            socket.emit(Constants.MSG_TYPES.NEXT_WORD, function(data) {
                shownWork.innerHTML="Here's your word: " + data
            })
        }
        finishTurnButton.onclick = () => {
            socket.emit(Constants.MSG_TYPES.FINISH_TURN)
        }
        body.appendChild(gotWordButton)
        body.appendChild(finishTurnButton)
    }
    body.appendChild(readyText)
    body.appendChild(wordTextButton)
}

export function renderGameInfoModal(update) {
    console.log('renderGameInfoModal invoked')
    var infoModal = document.getElementById(infoModalClassName)
    infoModal.innerHTML=''
    var modalList = document.createElement("ul")
    modalList.style.listStyle="none"
    // set team number
    var teamNumber = document.createElement("li")
    var teamNumberNode = document.createTextNode(`Your Team Number: ${update.team}`)
    teamNumber.appendChild(teamNumberNode)
    // set team 1 score
    var team1Score = document.createElement("li")
    var team1ScoreNode = document.createTextNode(`Team 1 Score: ${update.team1Score}`)
    team1Score.appendChild(team1ScoreNode)
    // set team 2 score
    var team2Score = document.createElement("li")
    var team2ScoreNode = document.createTextNode(`Team 2 Score: ${update.team2Score}`)
    team2Score.appendChild(team2ScoreNode)

    // set team 2 score
    var team2Score = document.createElement("li")
    var team2ScoreNode = document.createTextNode(`Team 2 Score: ${update.team2Score}`)
    team2Score.appendChild(team2ScoreNode)

    // set personalScore
    var personalScore = document.createElement("li")
    var personalScoreNode = document.createTextNode(`Personal Score: ${update.personalScore}`)
    personalScore.appendChild(personalScoreNode)

    // set room code
    var roomCode = document.createElement("li")
    var roomCodeNode = document.createTextNode(`Room ID: ${update.room}`)
    roomCode.appendChild(roomCodeNode)

    // set round
    var round = document.createElement("li")
    var roundNode = document.createTextNode(`Round: ${update.round}`)
    round.appendChild(roundNode)

    // set round
    var username = document.createElement("li")
    var usernameNode = document.createTextNode(`Your Username: ${update.username}`)
    username.appendChild(usernameNode)

    modalList.appendChild(teamNumber)
    modalList.appendChild(team1Score)
    modalList.appendChild(team2Score)
    modalList.appendChild(personalScore)
    modalList.appendChild(round)
    modalList.appendChild(roomCode)
    modalList.appendChild(username)
    infoModal.appendChild(modalList)
}

export function renderWhoIsUpNextScreen(update) {
    var gameBackground = document.getElementsByClassName(gameClassName)[0]
    gameBackground.innerHTML = ''
    var currPlayer = document.createElement("h1")
    currPlayer.innerHTML = `It's ${update.currPlayerName}'s turn`
    var nextPlayer = document.createElement("h2")
    let nextPlayerText = `${update.nextPlayerName} is up next`
    if (update.nextPlayerName === update.username) {
        nextPlayerText = `You're up next!`
    }
    nextPlayer.innerHTML = nextPlayerText
    gameBackground.appendChild(currPlayer)
    gameBackground.appendChild(nextPlayer)
}

export function renderHasStartedScreen() {
     // the code below is really bad. need to refactor this
     var gameBackground = document.getElementsByClassName(gameClassName)[0]
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
    // the code below is really bad. need to refactor this
    var gameBackground = document.getElementsByClassName(gameClassName)[0]
    gameBackground.innerHTML = ''
    
    var instructionsText = document.createElement("p")
    instructionsText.innerHTML = "Think of 3-5 prompts and submit them below. Write anything just please be funny, like don't be boring ok."
    gameBackground.appendChild(instructionsText)
    for (let i = 0; i < 5; i++) {
        const input = document.createElement("input")
        input.id = "input"+i
        input.placeholder = "Write anything"
        input.type = "text"
        gameBackground.appendChild(input)
    }
    var button = document.createElement("button");
    button.innerHTML = "Submit";
    button.addEventListener ("click", function() {
        const input1 = document.getElementById('input0');
        const input2 = document.getElementById('input1');
        const input3 = document.getElementById('input2');
        const input4 = document.getElementById('input3');
        const input5 = document.getElementById('input4');
        submitWords(input1.value, input2.value, input3.value, input4.value, input5.value);
        renderReadyButton()
      });  
      gameBackground.appendChild(button)
}

export const renderReadyButton = () => {
    var body = document.getElementsByClassName(gameClassName)[0]
    body.innerHTML = ''
    var button = document.createElement("button");
    button.innerHTML = "Everyone's ready!";
    button.style.margin = "50px"
    button.addEventListener ("click", function() {
        startGame()
    });
    var everyoneIsReadyText = document.createElement("strong");
    everyoneIsReadyText.innerHTML = "Only click this when everyone playing the game has submitted. Otherwise you'll mess everything up ok"
    body.appendChild(everyoneIsReadyText)
    body.appendChild(button)
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