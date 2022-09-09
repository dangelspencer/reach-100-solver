import { Move } from './move';

export class Cell {
    public gridX: number;
    public gridY: number;

    public value: number | null = null;
    public moves: Move[] = [];

    constructor(x: number, y: number) {
        this.gridX = x;
        this.gridY = y;
    }

    getGridCoordinates() {
        return `(${this.gridX + 1}, ${this.gridY + 1})`;
    }
}
