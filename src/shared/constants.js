module.exports = Object.freeze({
    MSG_TYPES: {
        JOIN_GAME: 'join_game',
        JOIN_GAME_WITH_TEAM: 'join-game-with-team',
        SUBMIT_WORDS: 'submit-words',
        START_GAME: 'client-start-game',
        GAME_INFO: 'game-info',
        SERVER_PUSH_WORD: 'push-word',
        NEXT_TURN: 'next-turn',
        FINISH_TURN: 'finish-turn',
        ROUND_COMPLETE: 'round-complete',
        GAME_COMPLETE: 'game-complete',
        CONTINUE: 'continue',
        NEXT_WORD: 'next-word'
    },
    ROUND: {
        1: 'Taboo',
        2: 'Charades',
        3: 'One Word'
    }
})