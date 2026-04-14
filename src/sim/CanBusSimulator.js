export class CanBusSimulator {
    constructor() {
        this.messageBuffer = []; // Store the latest frames
    }

    // Helper to format a number into hex, padded to generic byte sizes
    toHexByte(val) {
        val = Math.max(0, Math.min(255, Math.round(val))); // Clamp to 0-255 uint8
        return val.toString(16).padStart(2, '0').toUpperCase();
    }
    
    toHexWord(val) {
        val = Math.max(0, Math.min(65535, Math.round(val))); // uint16
        return val.toString(16).padStart(4, '0').toUpperCase();
    }

    toHexWordSigned(val) {
        // Simple 16-bit 2s complement for signed values
        let intVal = Math.round(val);
        if (intVal < 0) {
            intVal = 0x10000 + intVal;
        }
        return (intVal & 0xFFFF).toString(16).padStart(4, '0').toUpperCase();
    }

    generateFrames(pack, ekf) {
        this.messageBuffer = [];
        const timestamp = Date.now() % 100000;

        // CAN ID 0x300: Pack Status (Voltage, Current, avg Temp)
        // Format: V_total (uint16_t, 0.1V/bit), Current (int16_t, 0.1A/bit), Temp (uint8_t, 1C/bit with 40 offset)
        const vWord = this.toHexWord(pack.packVoltage * 10);
        const iWord = this.toHexWordSigned(pack.packCurrent * 10);
        const tByte = this.toHexByte(pack.getMaxTemp() + 40); // 40 offset to handle negative
        const frame300 = `ID: 0x300  DLC: 8  DATA: ${vWord.substring(0,2)} ${vWord.substring(2)} ${iWord.substring(0,2)} ${iWord.substring(2)} ${tByte} 00 00 00`;
        this.messageBuffer.push({ ts: timestamp, text: frame300 });

        // CAN ID 0x301: EKF Telemetry (Est SOC, True Avg SOC, Est V_RC)
        // Format: SOC_est (uint16_t, 0.01%/bit), SOC_true (uint16_t, 0.01%/bit)
        const socEstWord = this.toHexWord(ekf.getEstimatedSOC() * 100);
        const socTrueWord = this.toHexWord(pack.getAvgSoc() * 10000);
        const frame301 = `ID: 0x301  DLC: 8  DATA: ${socEstWord.substring(0,2)} ${socEstWord.substring(2)} ${socTrueWord.substring(0,2)} ${socTrueWord.substring(2)} 00 00 00 00`;
        this.messageBuffer.push({ ts: timestamp, text: frame301 });

        // CAN ID 0x302..0x305: Cell voltages multiplexed (4 cells per frame)
        // Format: Cell 1 (uint16_t mV), Cell 2 (uint16_t mV), Cell 3, Cell 4
        for (let frameIndex = 0; frameIndex < 4; frameIndex++) {
            const baseId = 0x302 + frameIndex;
            let dataStr = "";
            for (let c = 0; c < 4; c++) {
                const globalIndex = frameIndex * 4 + c;
                if (globalIndex < pack.numCells) {
                    const cVoltWord = this.toHexWord(pack.cells[globalIndex].Vt * 1000); // mV
                    dataStr += `${cVoltWord.substring(0,2)} ${cVoltWord.substring(2)} `;
                } else {
                    dataStr += `00 00 `;
                }
            }
            const frameCell = `ID: 0x30${(2+frameIndex).toString(16)}  DLC: 8  DATA: ${dataStr.trim()}`;
            this.messageBuffer.push({ ts: timestamp, text: frameCell });
        }

        return this.messageBuffer;
    }
}
