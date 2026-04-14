export class BatteryPack {
    constructor(numCells = 16, dt = 0.1) {
        this.numCells = numCells;
        this.dt = dt;
        
        // Per-cell parameters roughly representing a 50Ah cell
        this.capacityAh = 50;
        this.R0_base = 0.05;

        // Individual cell states
        // Start all cells around 85% with some random variation
        this.cells = Array.from({ length: numCells }, (_, i) => ({
            id: i + 1,
            trueSoc: 0.85 + (Math.random() - 0.5) * 0.02, // 84% - 86%
            vrc: 0.0,
            temperatureC: 25.0 + (Math.random() - 0.5) * 2.0, // 24-26C
            R0: this.R0_base * (1 + (Math.random() * 0.1)), // slight variation
            R1: 0.02,
            C1: 1500,
        }));
        
        // Pack state
        this.packVoltage = 0.0;
        this.packCurrent = 0.0; // Positive = discharging, Negative = charging
        
        this.tick(0);
    }

    // Simplistic OCV curve
    getOCV(soc) {
        const s = Math.min(Math.max(soc, 0.001), 0.999);
        return 3.0 + 0.8 * s + 0.4 * s * s; 
    }

    // Advance the simulation one time step
    tick(currentCommanded) {
        this.packCurrent = currentCommanded;
        this.packVoltage = 0.0;

        for (let i = 0; i < this.numCells; i++) {
            let cell = this.cells[i];

            // 1. Update true SOC (Coulomb counting)
            // capacity in As
            const capacityAs = this.capacityAh * 3600;
            // I > 0 means discharge -> SOC decreases
            cell.trueSoc -= (this.packCurrent * this.dt) / capacityAs;
            
            // Constrain
            if (cell.trueSoc < 0) cell.trueSoc = 0.01;
            if (cell.trueSoc > 1) cell.trueSoc = 1.0;

            // 2. Update RC pair
            const tau = cell.R1 * cell.C1;
            const expTau = Math.exp(-this.dt / tau);
            cell.vrc = cell.vrc * expTau + cell.R1 * (1 - expTau) * this.packCurrent;

            // 3. Compute terminal voltage for this cell
            const ocv = this.getOCV(cell.trueSoc);
            const Vt = ocv - cell.vrc - (cell.R0 * this.packCurrent);
            
            cell.Vt = Vt;
            this.packVoltage += Vt;

            // 4. Simple thermal model (I^2 * R heating)
            const powerDissipated = this.packCurrent * this.packCurrent * cell.R0;
            // Simple specific heat approximation
            const tempRise = (powerDissipated * this.dt) / 5000.0;
            // Ambient cooling towards 25C
            const cooling = (cell.temperatureC - 25.0) * 0.001 * this.dt;
            
            cell.temperatureC += tempRise - cooling;
        }
    }

    getAvgSoc() {
        return this.cells.reduce((sum, c) => sum + c.trueSoc, 0) / this.numCells;
    }

    getMinCellVoltage() {
        return Math.min(...this.cells.map(c => c.Vt));
    }

    getMaxCellVoltage() {
        return Math.max(...this.cells.map(c => c.Vt));
    }

    getMaxTemp() {
        return Math.max(...this.cells.map(c => c.temperatureC));
    }

    getFaults() {
        const faults = [];
        const maxV = this.getMaxCellVoltage();
        const minV = this.getMinCellVoltage();
        const maxT = this.getMaxTemp();
        const current = Math.abs(this.packCurrent);

        if (maxV > 4.25) faults.push({ type: 'OV', msg: 'Over-Voltage Detected (>4.25V)', level: 'CRITICAL' });
        if (minV < 2.8) faults.push({ type: 'UV', msg: 'Under-Voltage Detected (<2.8V)', level: 'CRITICAL' });
        if (maxT > 55.0) faults.push({ type: 'OT', msg: 'Over-Temperature Detected (>55°C)', level: 'CRITICAL' });
        if (current > 110.0) faults.push({ type: 'OC', msg: 'Over-Current Detected (>110A)', level: 'WARNING' });
        
        return faults;
    }
}
