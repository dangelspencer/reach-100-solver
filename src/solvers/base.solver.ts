import { Cell } from '../cell';
import { Grid } from '../grid';

export abstract class BaseSolver {
    public useColors = true;
    public showProgress = true;
    public sleepTime: number;

    public abstract sortWeightsLowToHigh: boolean;
    public abstract getMethodName(): string;
    public abstract weightFunction(cell: Cell, grid: Grid): number;

    async solve(startX: number, startY: number): Promise<Grid> {
        const grid = new Grid(this.getMethodName(), this.weightFunction);
        grid.useColors = this.useColors;
        grid.sortWeightsLowToHigh = this.sortWeightsLowToHigh;
        grid.showProgress = this.showProgress;
        grid.sleepTime = this.sleepTime;

        const startTime = performance.now();
        grid.setStartPosition(startX, startY);
        while (await grid.step()) {}
        grid.duration =
            Math.floor((performance.now() - startTime) * 1000) / 1000;

        return grid;
    }

    async solveAllPositions() {
        const grids: Grid[] = [];

        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                grids.push(await this.solve(x, y));
            }
        }

        grids.sort((a, b) => a.duration - b.duration);
        const fastestSolve = grids[0];
        const slowestSolve = grids[grids.length - 1];
        const totalSolveTime = grids.reduce(
            (acc, grid) => acc + grid.duration,
            0,
        );
        const averageTime = totalSolveTime / grids.length;

        console.log('\u001B[2J\u001B[0;0f');
        console.log(`METHOD: ${this.getMethodName()}\n`);

        console.log('Fastest:');
        console.log(`    Start Position: ${fastestSolve.getStartPosition()}`);
        console.log(
            `    Duration: ${grids[0].formatDuration(fastestSolve.duration)}`,
        );
        console.log(`    Backtracked: ${fastestSolve.backtrackedNum}`);
        console.log(`    Steps: ${fastestSolve.steps}`);

        console.log('\nSlowest:');
        console.log(`    Start Position: ${slowestSolve.getStartPosition()}`);
        console.log(
            `    Duration: ${grids[0].formatDuration(slowestSolve.duration)}`,
        );
        console.log(`    Backtracked: ${slowestSolve.backtrackedNum}`);
        console.log(`    Steps: ${slowestSolve.steps}`);

        console.log(`\nTotal: ${grids[0].formatDuration(totalSolveTime)}`);
        console.log(`Average: ${grids[0].formatDuration(averageTime)}`);

        console.log('\nAll Stats:');

        for (const grid of grids) {
            const startPos = grid.getStartPosition();
            const duration = grid.formatDuration(grid.duration);
            const steps = grid.steps;
            const backtrackedNum =
                grid.backtrackedNum === 100 ? '-' : grid.backtrackedNum;

            console.log(
                `${startPos}: \ttook: ${duration}, steps: ${steps}, backtracked: ${backtrackedNum}`,
            );
        }
    }
}
