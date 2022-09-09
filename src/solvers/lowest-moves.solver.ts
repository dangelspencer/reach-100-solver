import { Cell } from '../cell';
import { Grid } from '../grid';
import { BaseSolver } from './base.solver';

export class LowestMovesSolver extends BaseSolver {
    public sortWeightsLowToHigh = true;

    public getMethodName(): string {
        return 'lowest-moves';
    }

    public weightFunction(cell: Cell, grid: Grid): number {
        return grid.findMovesForCell(cell).length;
    }
}
