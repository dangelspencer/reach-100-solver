const SLEEP_TIME = 10;
const GOAL_NUMBER = 100;
const METHOD = ['neighbors', 'random', 'distance', 'close-neighbors', 'friendly-neighbors', 'social-distancing']
    .includes((process.env.METHOD ? process.env.METHOD : '')
    .toLowerCase()) ? process.env.METHOD : 'DEFAULT';
const DEBUG = process.env.DEBUG === 'true';
const SOLVE_ALL_POSITIONS = process.env.SOLVE_ALL_POSITIONS === 'true' || process.env.SOLVE_ALL_POSITIONS === 'TRUE';
let ALL_NOTIFICATIONS = false;
let SOLVE_NOTIFICATION = false;
if (process.env.NOTIFICATIONS) {
    if (process.env.NOTIFICATIONS.toLowerCase() === 'all') {
        ALL_NOTIFICATIONS = true;
    } else if (process.env.NOTIFICATIONS.toLowerCase() === 'solve') {
        SOLVE_NOTIFICATION = true;
    }
}

const util = require('util');
const exec = util.promisify(require('child_process').exec);

const notify = async (message) => {
    await exec(`./notify.sh "${message}"`);
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

    printStats() {
        let text = '';
        text += '\u001B[2J\u001B[0;0f';

        text += `\nStart: (${this.cells[0].x + 1},${this.cells[0].y + 1}), Method: ${METHOD ? METHOD.toUpperCase() : 'DEFAULT'}`;
        text += `\nHighest: ${getColorForCell(this.highestNumber)}, Backtracked: ${getColorForCell(this.backtrackedTo)}`;
        text += `\nCurrent: ${getColorForCell(this.cells[this.cells.length - 1].value)}`;
        text += '\n';

        return text;
    }


    printState(printAllMoves = false) {
        let text = '';

        text += '\n---------------------------------------------------';
        for (const row of this.grid) {
            text += '\n| ' + row.map(cell => cell.value == null ? '  ' : getColorForCell(cell.value)).join(' | ') + ' |';
            text += '\n---------------------------------------------------';
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
                text += `\n${number}: ${move.direction} -> (${move.x + 1}, ${move.y + 1})`;
            }

            text += '\n';

            if (!printAllMoves) {
                text += this.cells[this.cells.length - 1];
            } else {
                text += '\n\x1b[32mSUCCESS!\x1b[0m';
            }
        }

        return text;
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
            case 'close-neighbors':
                return moves.sort((a,b) => { 
                    if (a.distanceFromStart === b.distanceFromStart) {
                        return b.numNeighbors - a.numNeighbors;
                    }

                    return a.distanceFromStart - b.distanceFromStart;
                });
            case 'friendly-neighbors':
                return moves.sort((a,b) => { 
                    if (b.numNeighbors === a.numNeighbors) {
                        return a.distanceFromStart - b.distanceFromStart; 
                    }

                    return b.numNeighbors - a.numNeighbors;
                });
            case 'social-distancing':
                return moves.sort((a,b) => a.numNeighbors - b.numNeighbors);
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

        const stats = this.printStats();
        const gridState = this.printState();

        console.log(stats);
        console.log(gridState);

        await this.sleep(SLEEP_TIME);

        return this.cells[this.cells.length - 1].value === GOAL_NUMBER ? false : true;
    }

    async move(move) {
        const lastCell = this.cells[this.cells.length - 1];

        this.grid[move.y][move.x].value = lastCell.value + 1;
        const cell = this.grid[move.y][move.x];

        if (this.highestNumber < lastCell.value + 1) {
            this.highestNumber = lastCell.value + 1;
            if (this.highestNumber > 95 && ALL_NOTIFICATIONS) {
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

            if (this.backtrackedTo < 82 && ALL_NOTIFICATIONS) {
                await notify(`Backtracked to: ${this.backtrackedTo}`);
            }
        }
    }
}

const getFormatTime = (time) => {
    let leftover = time;

    const days = Math.floor(leftover / 1000 / 60 / 60 / 24);
    leftover = leftover - (days * 24 * 60 * 60 * 1000);

    const hours = Math.floor(leftover / 1000 / 60 / 60);
    leftover = leftover - (hours * 60 * 60 * 1000);

    const minutes =  Math.floor(leftover / 1000 / 60);
    leftover = leftover - (minutes * 60 * 1000);

    const seconds =  Math.floor(leftover / 1000);
    leftover = leftover - (seconds * 1000);

    const milliseconds = Math.floor(leftover);

    const formattedParts = [];

    if (days > 0) {
        formattedParts.push(`${days}d`);
    }

    if (hours > 0) {
        formattedParts.push(`${hours}h`);
    }

    if (minutes > 0) {
        formattedParts.push(`${minutes}m`);
    }

    if (seconds > 0) {
        formattedParts.push(`${seconds}s`);
    }

    if (milliseconds > 0) {
        formattedParts.push(`${milliseconds}ms`);
    }

    return formattedParts.join(', ');
}

const run = async () => {
    const timings = [];

    outer:
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
            const start = performance.now();
            if (ALL_NOTIFICATIONS) {
                await notify(`Using start position: (${j + 1}, ${i + 1})`);
            }
            const grid = new Grid(j, i);
            while (await grid.step()) {}

            const end = performance.now();

            const duration = end - start;

            timings.push(duration);
            const formattedTime = getFormatTime(duration);
            if (SOLVE_NOTIFICATION) {
                await notify(`${METHOD.toUpperCase()} - solved from (${j + 1}, ${i + 1}) in ${formattedTime}`);
            }

            if(!SOLVE_ALL_POSITIONS) {
                break outer;
            }
        }
    }

    const averageSolveTime = timings.reduce((acc, timing) => acc + timing, 0) / timings.length;

    const finishedMessage = `${METHOD.toUpperCase()} - average solve time: ${getFormatTime(averageSolveTime)}`;

    console.clear();
    console.log(finishedMessage);
    if (SOLVE_NOTIFICATION) {
        await notify(finishedMessage);
    }
}

run();
