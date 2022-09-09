import { BaseSolver } from './base.solver';

export class DefaultSolver extends BaseSolver {
    public sortWeightsLowToHigh = true;

    public getMethodName(): string {
        return 'default';
    }

    public weightFunction(): number {
        return 0;
    }
}
