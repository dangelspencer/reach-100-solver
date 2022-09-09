import { Cell } from './cell';
import { Directions, Move } from './move';

export class Grid {
    private grid: Cell[][] = [];
    private cells: Cell[] = [];
    private moves: Move[] = [];
    private methodName: string;

    public highestNum = 0;
    public backtrackedNum = 100;
    public steps = 1;
    public duration = 0;

    public targetNumber = 100;
    public sleepTime = 0;
    public useColors = true;
    public sortWeightsLowToHigh: boolean;
    public showProgress = true;
    public numberOfColumnsInMoveList = 3;

    private weightFunc: (cell: Cell, grid: Grid) => number;

    constructor(
        methodName: string,
        weightFunc: (cell: Cell, grid: Grid) => number,
    ) {
        this.methodName = methodName.toUpperCase();
        this.weightFunc = weightFunc;

        for (let y = 0; y < 10; y++) {
            const row: Cell[] = [];

            for (let x = 0; x < 10; x++) {
                row.push(new Cell(x, y));
            }

            this.grid.push(row);
        }
    }

    public setStartPosition(x: number, y: number) {
        const cell = this.getCellAt(x, y);
        cell.value = 1;
        cell.moves = this.findMovesForCell(cell);

        this.cells.push(cell);
    }

    public getStartPosition(): string {
        return `(${this.cells[0].gridX + 1}, ${this.cells[0].gridY + 1})`;
    }

    private getCellAt(x: number, y: number) {
        return this.grid[y][x];
    }

    private calculateCellWeight(cell: Cell): number {
        return this.weightFunc(cell, this);
    }

    private gridHasUnreachableCells(move: Move) {
        move.destination.value = -1;

        let unreachableCells = 0;

        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                const cell = this.getCellAt(x, y);

                // skip cells with values
                if (cell.value != null) {
                    continue;
                }

                if (this.findMovesForCell(cell).length === 0) {
                    unreachableCells += 1;
                }
            }
        }

        move.destination.value = null;
        return unreachableCells > 1;
    }

    public findMovesForCell(cell: Cell): Move[] {
        const moves: Move[] = [];

        if (
            cell.gridY >= 3 &&
            this.grid[cell.gridY - 3][cell.gridX].value == null
        ) {
            const targetCell = this.grid[cell.gridY - 3][cell.gridX];
            moves.push(new Move(targetCell, Directions.NORTH));
        }

        if (
            cell.gridX <= 6 &&
            this.grid[cell.gridY][cell.gridX + 3].value == null
        ) {
            const targetCell = this.grid[cell.gridY][cell.gridX + 3];
            moves.push(new Move(targetCell, Directions.EAST));
        }

        if (
            cell.gridY <= 6 &&
            this.grid[cell.gridY + 3][cell.gridX].value == null
        ) {
            const targetCell = this.grid[cell.gridY + 3][cell.gridX];
            moves.push(new Move(targetCell, Directions.SOUTH));
        }

        if (
            cell.gridX >= 3 &&
            this.grid[cell.gridY][cell.gridX - 3].value == null
        ) {
            const targetCell = this.grid[cell.gridY][cell.gridX - 3];
            moves.push(new Move(targetCell, Directions.WEST));
        }

        if (
            cell.gridX <= 7 &&
            cell.gridY >= 2 &&
            this.grid[cell.gridY - 2][cell.gridX + 2].value == null
        ) {
            const targetCell = this.grid[cell.gridY - 2][cell.gridX + 2];
            moves.push(new Move(targetCell, Directions.NORTH_EAST));
        }

        if (
            cell.gridX <= 7 &&
            cell.gridY <= 7 &&
            this.grid[cell.gridY + 2][cell.gridX + 2].value == null
        ) {
            const targetCell = this.grid[cell.gridY + 2][cell.gridX + 2];
            moves.push(new Move(targetCell, Directions.SOUTH_EAST));
        }

        if (
            cell.gridX >= 2 &&
            cell.gridY <= 7 &&
            this.grid[cell.gridY + 2][cell.gridX - 2].value == null
        ) {
            const targetCell = this.grid[cell.gridY + 2][cell.gridX - 2];
            moves.push(new Move(targetCell, Directions.SOUTH_WEST));
        }

        if (
            cell.gridX >= 2 &&
            cell.gridY >= 2 &&
            this.grid[cell.gridY - 2][cell.gridX - 2].value == null
        ) {
            const targetCell = this.grid[cell.gridY - 2][cell.gridX - 2];
            moves.push(new Move(targetCell, Directions.NORTH_WEST));
        }

        return moves;
    }

    private getColorForCell(value: number | null): string {
        if (value == null) {
            return '  ';
        }

        let stringVal = `${value}`;

        if (value < 10) {
            stringVal = ` ${value}`;
        }

        if (!this.useColors) {
            return stringVal;
        }

        if (value < 30) {
            return `\x1b[31m${stringVal}\x1b[0m`;
        } else if (value < 60) {
            return `\x1b[33m${stringVal}\x1b[0m`;
        } else if (value < 90) {
            return `\x1b[34m${stringVal}\x1b[0m`;
        } else if (value <= 100) {
            return `\x1b[32m${stringVal}\x1b[0m`;
        }

        return stringVal;
    }

    public formatDuration(duration: number) {
        const days = Math.floor(duration / (86400 * 1000));
        duration -= days * (86400 * 1000);
        const hours = Math.floor(duration / (60 * 60 * 1000));
        duration -= hours * (60 * 60 * 1000);
        const minutes = Math.floor(duration / (60 * 1000));
        duration -= minutes * (60 * 1000);
        const seconds = Math.floor(duration / 1000);
        duration -= seconds * 1000;

        const milliseconds = Math.floor(duration * 1000) / 1000;

        const formattedIntervals = [];

        if (days > 0) {
            formattedIntervals.push(`${days}d`);
        }
        if (hours > 0) {
            formattedIntervals.push(`${hours}h`);
        }
        if (minutes > 0) {
            formattedIntervals.push(`${minutes}m`);
        }
        if (seconds > 0) {
            formattedIntervals.push(`${seconds}s`);
        }
        if (milliseconds > 0) {
            formattedIntervals.push(`${milliseconds}ms`);
        }

        return formattedIntervals.join(' ');
    }

    private getGridStats(): string[] {
        const stats: string[] = [];

        if (this.useColors) {
            stats.push(`METHOD: \x1b[36m${this.methodName}\x1b[0m`);
        } else {
            stats.push(`METHOD: ${this.methodName}`);
        }
        stats.push(`START: ${this.cells[0].getGridCoordinates()}`);

        stats.push('');

        stats.push(
            `CURRENT: ${this.getColorForCell(
                this.cells[this.cells.length - 1].value,
            )}`,
        );
        stats.push(`HIGHEST: ${this.getColorForCell(this.highestNum)}`);
        stats.push(
            `BACKTRACKED: ${
                this.backtrackedNum === 100
                    ? '-'
                    : this.getColorForCell(this.backtrackedNum)
            }`,
        );
        stats.push(`STEPS: ${this.steps}`);

        if (this.duration !== 0) {
            stats.push('');
            stats.push(`DURATION: ${this.formatDuration(this.duration)}`);
            const stepsPerSecond =
                Math.floor((this.steps / (this.duration / 1000)) * 1000) / 1000;
            stats.push(`SPEED: ${stepsPerSecond} steps/s`);
        }

        return stats;
    }

    private getGridState(includeStats = true): string {
        const lines: string[] = [];
        lines.push('---------------------------------------------------');
        for (const row of this.grid) {
            let line =
                '| ' +
                row
                    .map((cell) => this.getColorForCell(cell.value))
                    .join(' | ') +
                ' |';

            if (line.includes('100')) {
                line =
                    line.substring(0, line.indexOf(' ', line.indexOf('100'))) +
                    line.substring(line.indexOf(' ', line.indexOf('100')) + 1);
            }

            lines.push(line);
            lines.push('---------------------------------------------------');
        }

        if (includeStats) {
            const stats = this.getGridStats();

            for (let i = 0; i < stats.length && i < lines.length - 2; i++) {
                lines[i + 1] += `    ${stats[i]}`;
            }
        }

        return lines.join('\n');
    }

    public printGridState() {
        console.log(`\u001B[2J\u001B[0;0f\n${this.getGridState()}`);
    }

    public printStats() {
        console.log(
            this.getGridStats()
                .filter((stat) => stat !== '')
                .join('\n'),
        );
    }

    public printMoves() {
        console.log('\nMOVE LIST:');

        const moveList: string[] = [];

        if (this.useColors) {
            moveList.push(
                `1: \x1b[32mSTART\x1b[0m -> ${this.getStartPosition()}`,
            );
        } else {
            moveList.push(`1: START -> ${this.getStartPosition()}`);
        }

        for (let i = 0; i < this.moves.length; i++) {
            let moveDirection = this.moves[i].direction as string;
            if (this.useColors) {
                moveDirection = `\x1b[36m${this.moves[i].direction}\x1b[0m`;
            }

            moveList.push(
                `${i + 2}: ${moveDirection} -> ${this.moves[
                    i
                ].destination.getGridCoordinates()}`,
            );
        }

        const longestMoveDescription = moveList.reduce(
            (acc, moveDescription) =>
                moveDescription.length > acc ? moveDescription.length : acc,
            0,
        );

        while (moveList.length % this.numberOfColumnsInMoveList !== 0) {
            moveList.push('');
        }

        const padRight = (moveDescription: string) => {
            while (moveDescription.length < longestMoveDescription) {
                moveDescription += ' ';
            }

            return moveDescription;
        };

        const numRowsInColumn =
            moveList.length / this.numberOfColumnsInMoveList;

        for (let i = 0; i < numRowsInColumn; i++) {
            let row = '';
            for (let j = 0; j < this.numberOfColumnsInMoveList; j++) {
                row +=
                    padRight(moveList[i + j * numRowsInColumn]) +
                    (j === this.numberOfColumnsInMoveList - 1 ? '' : '\t');
            }

            console.log(row);
        }
    }

    private async sleep(): Promise<void> {
        if (this.sleepTime === 0) {
            return;
        }

        return new Promise((resolve) => {
            setTimeout(() => resolve(), this.sleepTime);
        });
    }

    public async step(): Promise<boolean> {
        this.steps += 1;

        const cell = this.cells[this.cells.length - 1];

        if (cell.moves.length === 0) {
            this.undoLastMove();
        } else {
            this.move(cell.moves[0]);
            cell.moves.splice(0, 1);
        }

        if (
            this.showProgress &&
            (this.sleepTime > 9 || this.steps % 15000 === 0)
        ) {
            this.printGridState();
        }

        await this.sleep();

        return this.cells[this.cells.length - 1].value === this.targetNumber
            ? false
            : true;
    }

    private move(move: Move) {
        const lastCell = this.cells[this.cells.length - 1];
        const nextValue = (lastCell.value as number) + 1;

        const nextCell = move.destination;
        nextCell.value = nextValue;

        if (this.highestNum < nextValue) {
            this.highestNum = nextValue;
        }

        const moves = this.findMovesForCell(nextCell).filter(
            (move) => !this.gridHasUnreachableCells(move),
        );

        for (const move of moves) {
            move.weight = this.calculateCellWeight(move.destination);
        }

        if (this.sortWeightsLowToHigh) {
            nextCell.moves = moves.sort((a, b) => a.weight - b.weight);
        } else {
            nextCell.moves = moves.sort((a, b) => b.weight - a.weight);
        }

        this.moves.push(move);
        this.cells.push(nextCell);
    }

    private undoLastMove() {
        // remove last move from list
        this.moves.splice(0, 1);

        const cell = this.cells[this.cells.length - 1];
        if (cell.moves.length === 0) {
            // remove last cell
            this.cells[this.cells.length - 1].value = null;
            this.cells.splice(this.cells.length - 1, 1);

            const lastCellValue = this.cells[this.cells.length - 1].value;
            if (lastCellValue != null && lastCellValue < this.backtrackedNum) {
                this.backtrackedNum = lastCellValue;
            }
        }
    }
}
