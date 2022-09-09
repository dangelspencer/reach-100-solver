import { DefaultSolver } from './solvers/default.solver';
import { LowestMovesSolver } from './solvers/lowest-moves.solver';
import { RandomSolver } from './solvers/random.solver';
import * as yargs from 'yargs';
import { BaseSolver } from './solvers/base.solver';

const methodList = ['default', 'lowest-moves', 'random'] as const;

const argv = yargs
    .command('solve', 'Solve a single position', {
        position: {
            description: 'which position to start from',
            alias: 'p',
            type: 'string',
            demandOption: true,
            conflicts: 'solve-all',
            requiresArg: true,
        },
    })
    .command('solve-all', 'Solve all board positions')
    .option('method', {
        alias: 'm',
        description: 'which solve method to use',
        choices: methodList,
        default: 'default',
        requiresArg: true,
    })
    .option('no-colors', {
        description: 'disable colors in the console',
        type: 'boolean',
    })
    .option('sleep-time', {
        description: 'disable colors in the console',
        type: 'number',
        requiresArg: true,
    })
    .option('show-moves', {
        description: 'disable colors in the console',
        type: 'boolean',
    })
    .option('no-progress', {
        description:
            'hide the grid and statistics until the board solution is solved',
        type: 'boolean',
    })
    .demandCommand(1, 'Please specify what kind of solving you want')
    .help()
    .alias('help', 'h')
    .example([
        ['$0 solve --position 1,1', 'solve the board state starting at (1, 1)'],
        [
            '$0 solve-all --method lowest-moves',
            'Solve all starting positions using the LOWEST-MOVES solve method',
        ],
    ]).argv;

if (argv.time) {
    console.log('The current time is: ', new Date().toLocaleTimeString());
}

let solver: BaseSolver = null;

switch (argv.method.toLowerCase()) {
    case 'lowest-moves':
        solver = new LowestMovesSolver();
        break;
    case 'random':
        solver = new RandomSolver();
        break;
    case 'default':
    default:
        solver = new DefaultSolver();
}

const run = async () => {
    solver.useColors = argv['colors'] == null || argv['colors'] != false;
    solver.showProgress = argv['progress'] == null || argv['progress'] != false;

    let sleepTime = 0;
    if (argv['sleep-time'] && argv['sleep-time']) {
        sleepTime = argv['sleep-time'];
    }

    solver.sleepTime = sleepTime;

    const showMoves = argv['show-moves'] != null && argv['show-moves'] == true;

    if (argv._.includes('solve')) {
        const position = argv.position as string;

        if (!position.includes(',')) {
            yargs.showHelp();
            console.log(
                `\nPosition "${position}" is invalid, please use format "x,y"`,
            );
            process.exit();
        }

        const startPos = position.split(',');
        const startX = parseInt(startPos[0].trim()) - 1;
        const startY = parseInt(startPos[1].trim()) - 1;

        const grid = await solver.solve(startX, startY);
        grid.printGridState();
        if (showMoves) {
            grid.printMoves();
        }
    } else {
        await solver.solveAllPositions();
    }
};

run();
