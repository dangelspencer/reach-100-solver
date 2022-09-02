# reach-100-solver

I got bored ok

## Game
https://reach-100.com/

## Current Methods
* DEFAULT: takes the first available move in the order they're calculated
* RANDOM: takes random move from list
* NEIGHBORS: prefers cells with the highest amount of neighboring numbers
* DISTANCE: prefers to make moves that are closer to the starting position
* CLOSE-NEIGHBORS: prefers DISTANCE method, falling back to NEIGHBORS when the distances are the same
* FRIENDLY-NEIGHBORS: prefers NEIGHBORS method and falls back to DISTANCE
* SOCIAL-DISTANCING: prefers cells with the fewest amount of neighboring numbers

## Environment Vars
| Name | Description                | Type    | Default Value |
|------|----------------------------|---------|---------------|
|METHOD| which method to solve with | (see above)  | DEFAULT       |
|DEBUG | enables debug logging      | boolean | false         |
|NOTIFICATIONS | which notifications to enable | ['ALL', 'SOLVE'] | none | 