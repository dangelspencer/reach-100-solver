import { Cell } from './cell';

export enum Directions {
    NORTH = 'NORTH',
    EAST = 'EAST',
    SOUTH = 'SOUTH',
    WEST = 'WEST',
    NORTH_EAST = 'NORTH EAST',
    SOUTH_EAST = 'SOUTH EAST',
    SOUTH_WEST = 'SOUTH WEST',
    NORTH_WEST = 'NORTH WEST',
}

export class Move {
    public destination: Cell;
    public direction: Directions;
    public weight: number;

    constructor(cell: Cell, direction: Directions) {
        this.destination = cell;
        this.direction = direction;
    }
}
