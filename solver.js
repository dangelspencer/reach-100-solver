const SLEEP_TIME = 10;
const GOAL_NUMBER = 100;
const METHOD = ['neighbors', 'random', 'distance'].includes((process.env.METHOD ? process.env.METHOD : '').toLowerCase()) ? process.env.METHOD : 'DEFAULT';
const NOTIFICATIONS = process.env.ENABLE_NOTIFICATIONS === 'true' ? true : false;
const DEBUG = false;

const util = require('util');
const exec = util.promisify(require('child_process').exec);

const notify = async (message, ignorePreference) => {
    if (NOTIFICATIONS || ignorePreference) {
        await exec(`./notify.sh "${message}"`);
    }
}

const getColorForCell = (value) => {
    if (value < 10) {
        value = ` ${value}`;
    }

    if (value < 30) { 
        return `\x1b[31m${value}\x1b[0m`;
    } else if (value < 60) { 
        return `\x1b[33m${value}\x1b[0m`;
    } else if (value < 90) {
        return `\x1b[34m${value}\x1b[0m`;
    } else if (value <= 100) {
        return `\x1b[32m${value}\x1b[0m`;
    }

    return value;
};

class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.value = null;
        this.moves = [];
    }
}

class Move {
    constructor(x, y, dir, numNeighbors, distanceFromStart) {
        this.x = x;
        this.y = y;
        this.direction = dir;
        this.numNeighbors = numNeighbors;
        this.distanceFromStart = distanceFromStart;
    }
}

class Grid {
    constructor(startX, startY) {
        this.resetGrid();
        this.createInitialCell(startX, startY);
    }

    resetGrid() {
        this.grid = [];
        for (let i = 0; i < 10; i++) {
            const row = [];
    
            for (let j = 0; j < 10; j++) {
                row.push(new Cell(j, i));
            }
    
            this.grid.push(row);
        }

        this.curNumber = 1;
        this.moves = [];
        this.cells = [];
        this.highestNumber = 0;
        this.backtrackedTo = 100;
    }

    createInitialCell(x, y) {
        this.grid[y][x].value = 1;
        const cell = this.grid[y][x];

        cell.moves = this.availableMoves(cell)
            .filter(move => !this.unreachableCellsAfterMove(move));

        this.cells.push(cell);
    }

    print(printAllMoves = false) {
        console.log('\u001B[2J\u001B[0;0f');

        console.log(`Start: (${this.cells[0].x + 1},${this.cells[0].y + 1}), Method: ${METHOD ? METHOD.toUpperCase() : 'DEFAULT'}`);
        console.log(`Highest: ${getColorForCell(this.highestNumber)}, Backtracked: ${getColorForCell(this.backtrackedTo)}`);
        console.log(`Current: ${getColorForCell(this.cells[this.cells.length - 1].value)}`);
        console.log();

        console.log('---------------------------------------------------');
        for (const row of this.grid) {
            console.log('| ' + row.map(cell => cell.value == null ? '  ' : getColorForCell(cell.value)).join(' | ') + ' |');
            console.log('---------------------------------------------------');
        }

        if (DEBUG || printAllMoves) {
            const rollingMovesCount = 20;
            let startIndex = 0;
            if (this.moves.length > rollingMovesCount && !printAllMoves) {
                startIndex = this.moves.length - rollingMovesCount;
            }

            for (let i = startIndex; i < this.moves.length; i++) {
                const move = this.moves[i];
                const number = i + 2;
                console.log(`${number}: ${move.direction} -> (${move.x + 1}, ${move.y + 1})`);
            }

            console.log();

            if (!printAllMoves) {
                console.log(this.cells[this.cells.length - 1]);
            } else {
                console.log('\x1b[32mSUCCESS!!!\x1b[0m');
            }
        }
    }

    distanceFromStart(cell) {
        if (this.cells.length === 0) {
            return 0;
        }
        
        const firstCell = this.cells[0];

        const x = Math.abs(firstCell.x - cell.x);
        const y = Math.abs(firstCell.y - cell.y);

        return x + y;
    }

    availableMoves(cell) {
        const moves = [];

        // NORTH
        if (cell.y >= 3 && this.grid[cell.y - 3][cell.x].value == null) {
            const targetCell = this.grid[cell.y - 3][cell.x];
            moves.push(new Move(cell.x, cell.y - 3, 'NORTH', this.numNeighbors(targetCell), this.distanceFromStart(targetCell)));
        }

        // EAST
        if (cell.x <= 6 && this.grid[cell.y][cell.x + 3].value == null) {
            const targetCell = this.grid[cell.y][cell.x + 3];
            moves.push(new Move(cell.x + 3, cell.y, 'EAST', this.numNeighbors(targetCell), this.distanceFromStart(targetCell)));
        }

        // SOUTH
        if (cell.y <= 6 && this.grid[cell.y + 3][cell.x].value == null) {
            const targetCell = this.grid[cell.y + 3][cell.x];
            moves.push(new Move(cell.x, cell.y + 3, 'SOUTH', this.numNeighbors(targetCell), this.distanceFromStart(targetCell)));
        }

        // WEST
        if (cell.x >= 3 && this.grid[cell.y][cell.x - 3].value == null) {
            const targetCell = this.grid[cell.y][cell.x - 3];
            moves.push(new Move(cell.x - 3, cell.y, 'WEST', this.numNeighbors(targetCell), this.distanceFromStart(targetCell)));
        }

        // NORTH-EAST
        if (cell.x <= 7 && cell.y >= 2 && this.grid[cell.y - 2][cell.x + 2].value == null) {
            const targetCell = this.grid[cell.y - 2][cell.x + 2];
            moves.push(new Move(cell.x + 2, cell.y - 2, 'NORTH-EAST', this.numNeighbors(targetCell), this.distanceFromStart(targetCell)));
        }

        // SOUTH-EAST
        if (cell.x <= 7 && cell.y <= 7 && this.grid[cell.y + 2][cell.x + 2].value == null) {
            const targetCell = this.grid[cell.y + 2][cell.x + 2];
            moves.push(new Move(cell.x + 2, cell.y + 2, 'SOUTH-EAST', this.numNeighbors(targetCell), this.distanceFromStart(targetCell)));
        }

        // SOUTH-WEST
        if (cell.x >= 2 && cell.y <= 7 && this.grid[cell.y + 2][cell.x - 2].value == null) {
            const targetCell = this.grid[cell.y + 2][cell.x - 2];
            moves.push(new Move(cell.x - 2, cell.y + 2, 'SOUTH-WEST', this.numNeighbors(targetCell), this.distanceFromStart(targetCell)));
        }

        // NORTH-WEST
        if (cell.x >= 2 && cell.y >= 2 && this.grid[cell.y - 2][cell.x - 2].value == null) {
            const targetCell = this.grid[cell.y - 2][cell.x - 2];
            moves.push(new Move(cell.x - 2, cell.y - 2, 'NORTH-WEST', this.numNeighbors(targetCell), this.distanceFromStart(targetCell)));
        }

        switch (METHOD.toLowerCase()) {
            case 'neighbors':
                return moves.sort((a,b) => b.numNeighbors - a.numNeighbors);
            case 'random':
                return moves
                    .map(move => { 
                        return { move, weight: Math.random()}
                    })
                    .sort((a, b) => a.weight - b.weight)
                    .map(obj => obj.move);
            case 'distance':
                return moves.sort((a,b) => a.distanceFromStart - b.distanceFromStart);
            default:
                return moves;
        }
    }

    async sleep (time) {
        if (time == 0) {
            return;
        }

        return new Promise((resolve) => {
            setTimeout(() => resolve(), time);
        })
    }

    unreachableCellsAfterMove(move) {
        this.grid[move.y][move.x].value = 'temp';

        let unreachableCells = 0;

        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                // skip cells with values
                if (this.grid[j][i].value != null) {
                    continue;
                }


                if (this.availableMoves(this.grid[j][i]).length === 0) {
                    unreachableCells += 1;
                }
            }
        }

        this.grid[move.y][move.x].value = null;
        return unreachableCells > 0;
    }

    numNeighbors(cell) {
        let neighbors = 0;

        if (cell.x > 0) {
            // WEST
            if (this.grid[cell.y][cell.x - 1].value) {
                neighbors += 1;
            }

            // NORTH-WEST
            if (cell.y > 0) {
                if (this.grid[cell.y - 1][cell.x - 1].value) {
                    neighbors += 1;
                }
            }

            // SOUTH-WEST
            if (cell.y < 9) {
                if (this.grid[cell.y + 1][cell.x - 1].value) {
                    neighbors += 1;
                }
            }
        }

        if (cell.x < 9) {
            // EAST
            if (this.grid[cell.y][cell.x + 1].value) {
                neighbors += 1;
            }

            // SOUTH-EAST
            if (cell.y < 9) {
                if (this.grid[cell.y + 1][cell.x + 1].value) {
                    neighbors += 1;
                }
            }

            // NORTH-EAST
            if (cell.y > 0) {
                if (this.grid[cell.y - 1][cell.x + 1].value) {
                    neighbors += 1;
                }
            }
        }

        // NORTH
        if (cell.y > 0) {
            if (this.grid[cell.y - 1][cell.x].value) {
                neighbors += 1;
            }
        }

        // SOUTH
        if (cell.y < 9) {
            if (this.grid[cell.y + 1][cell.x].value) {
                neighbors += 1;
            }
        }

        return neighbors;
    }

    async step() {
        // get current cell
        const cell = this.cells[this.cells.length - 1];

        if (cell.moves.length === 0) {
            await this.undoLastMove();
        } else {
            await this.move(cell.moves[0]);
            cell.moves.splice(0, 1);
        }

        this.print();

        await this.sleep(SLEEP_TIME);

        return this.cells[this.cells.length - 1].value === GOAL_NUMBER ? false : true;
    }

    async move(move) {
        const lastCell = this.cells[this.cells.length - 1];

        this.grid[move.y][move.x].value = lastCell.value + 1;
        const cell = this.grid[move.y][move.x];

        if (this.highestNumber < lastCell.value + 1) {
            this.highestNumber = lastCell.value + 1;
            if (this.highestNumber > 95) {
                await notify(`Highest number: ${this.highestNumber}`);
            }
        }

        cell.moves = this.availableMoves(cell)
            .filter(move => !this.unreachableCellsAfterMove(move));

        this.moves.push(move);
        this.cells.push(cell);
    }

    async undoLastMove() {
        const cell = this.cells[this.cells.length - 1];
        const lastMove = this.moves.splice(this.moves.length - 1, 1);
        const indexOfLastMove = cell.moves.indexOf(move => move.direction === lastMove.direction);
        cell.moves.splice(indexOfLastMove, 1);

        this.cells[this.cells.length - 1].value = null;
        this.cells.splice(this.cells.length - 1, 1);

        if (this.cells[this.cells.length - 1].value < this.backtrackedTo) {
            this.backtrackedTo = this.cells[this.cells.length - 1].value;

            if (this.backtrackedTo < 82) {
                await notify(`Backtracked to: ${this.backtrackedTo}`);
            }
        }
    }
}

const run = async () => {
    console.time('took');
    outer:
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
            await notify(`Using start position: (${j + 1}, ${i + 1})`);
            const grid = new Grid(j, i);
            grid.print();
            while (await grid.step()) {}

            const lastCell = grid.cells[grid.cells.length - 1];

            if (lastCell.value === GOAL_NUMBER) {
                grid.print(true);

                console.timeEnd('took');
                await notify(`SOLVED WITH ${METHOD.toUpperCase()} METHOD!!!!`, true);
                break outer;
            }
        }
    }    
}

run();