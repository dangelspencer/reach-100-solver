# reach-100-solver

I got bored ok

## Game
https://reach-100.com/

## Current Methods
* DEFAULT: takes the first available move in the order they're calculated
* RANDOM: takes random move from list
* NEIGHBORS: prefers to make moves that result in the most number of neighoring cells with numbers
* DISTANCE: prefers to make moves that are closer to the starting position
* CLOSE-NEIGHBORS: DISTANCE method, falling back to NEIGHBORS when the distances are the same

## Environment Vars
| Name | Description                | Type    | Default Value |
|------|----------------------------|---------|---------------|
|METHOD| which method to solve with | (see above)  | DEFAULT       |
|DEBUG | enables debug logging      | boolean | false         |
|NOTIFICATIONS | which notifications to enable | ['ALL', 'SOLVE'] | none | 