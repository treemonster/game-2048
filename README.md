## Requirements

1. node v18

2. npm v6

3. macOS >= 10 or windows 11


## Install

1. `npm i`

## Train

1. `npm run train`

## Test

1. `npm run test`

## Add human expert tracks

1. `npm run game`

2. open `http://127.0.0.1:9090/index.html`

3. play the 2048 game.

4. when the game is over, if you have achieved a value of 2048, your previous moves 
will be saved to a JSON file within the `exp-tracks` folder, and can be used for training the model.
