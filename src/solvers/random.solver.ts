import { BaseSolver } from './base.solver';

export class RandomSolver extends BaseSolver {
    public sortWeightsLowToHigh = true;

    public getMethodName(): string {
        return 'random';
    }

    public weightFunction(): number {
        return Math.random();
    }
}
