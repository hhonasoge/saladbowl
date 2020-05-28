# Salad Bowl
(aka Fish Bowl)
This is an implementation of the Salad Bowl game. It's a fun guessing game that works as follows:
- Gather a group of friends (I've found that 8-10 people works best :))
- Each player submits 1-5 "prompts", which can be anything really - an amusing phrase, inside joke, even just a word
- Once all players submit the prompt, players are divided into two teams
- One player from each team takes turns drawing from the Salad Bowl (the bank of prompts):
    - The first round is "Taboo". The player's goal is to describe the prompt without using any words used in the prompt. Their team's goal is to guess the prompt. Each player's turn lasts one minute, during which their team tries to guess as many prompts as possible.
    - After all the prompts have been guessed, the second round begins: "Charades". Same rules: players from each team try to make their team guess prompts from the Salad Bowl. Only this time, they must act out the prompt - no words allowed.
    - The last round is "One Word": Players can only use a single word to describe the prompt (similar to Taboo, the chosen one word must not be included in the prompt)
    
Whichever team has the most number of points (correctly guessed prompts) by the end of round 3 wins!


# Development
```
git clone https://github.com/hhonasoge/saladbowl.git
npm install
npm run develop
```

# Deployment
This app is deployed via Heroku: https://pure-gorge-45167.herokuapp.com/. Deployment currently occurs automatically on commits to master.
