import { BatteryPack } from './src/sim/BatteryPack.js';
import { CanBusSimulator } from './src/sim/CanBusSimulator.js';
import { EKF } from './src/math/EKF.js';
import { Dashboard } from './src/ui/Dashboard.js';
import { EKFChart } from './src/ui/EKFChart.js';

// Configuration
const SIM_TICK_MS = 50;  // 20Hz update rate
const CAN_LOG_INTERVAL = 4; // Generate CAN msgs every nth tick
const NUM_CELLS = 16;
const DT = SIM_TICK_MS / 1000.0;

// Initialize Core Modules
const pack = new BatteryPack(NUM_CELLS, DT);
const canSim = new CanBusSimulator();
const ekf = new EKF(pack.capacityAh, DT);

// Initialize UI
const dashboard = new Dashboard(NUM_CELLS);
const ekfChart = new EKFChart('ekf-canvas');

// State
let tickCount = 0;
let commandedCurrent = 0; // Positive = discharge, Negative = charge

// UI Interactions
const slider = document.getElementById('current-slider');
slider.addEventListener('input', (e) => {
    commandedCurrent = parseInt(e.target.value, 10);
    dashboard.updateDemandSliderLabel(commandedCurrent);
});

// Run start
dashboard.updateDemandSliderLabel(commandedCurrent);

// The Main Loop
function simLoop() {
    tickCount++;

    // 1. Advance Physics Engine
    pack.tick(commandedCurrent);

    // 2. Advance EKF based on measured pack values
    // We treat the Pack current as a known input `u`
    // We treat the Pack Voltage divided by cell count as average cell voltage `y` (simplified for the 1-D EKF state)
    const avgMeasuredVoltage = pack.packVoltage / pack.numCells;
    
    ekf.predict(commandedCurrent);
    ekf.update(commandedCurrent, avgMeasuredVoltage);

    // 3. Update Chart (every tick for smooth lines)
    // Scale pack true soc to percentage
    const trueSocPct = pack.getAvgSoc() * 100.0;
    const estSocPct = ekf.getEstimatedSOC();
    ekfChart.pushData(trueSocPct, estSocPct);
    ekfChart.draw();

    // 4. Update Dashboard UI (Throttle to avoid freezing DOM)
    if (tickCount % 2 === 0) { // 10Hz UI update
        dashboard.updateHeader(
            pack.packVoltage,
            pack.packCurrent,
            pack.getMaxTemp(),
            estSocPct
        );
        dashboard.updateCells(pack.cells);
    }

    // 5. Generate and Log CAN Data
    if (tickCount % CAN_LOG_INTERVAL === 0) { // 5Hz CAN log
        const frames = canSim.generateFrames(pack, ekf);
        dashboard.logCanFrames(frames);
    }
}

// Start Simulator
setInterval(simLoop, SIM_TICK_MS);
