export class Dashboard {
    constructor(numCells) {
        this.numCells = numCells;
        
        // Element references
        this.elPackVoltage = document.getElementById('pack-voltage-val');
        this.elPackCurrent = document.getElementById('pack-current-val');
        this.elMaxTemp = document.getElementById('max-temp-val');
        this.elEkfSoc = document.getElementById('ekf-soc-val');
        
        this.elCellList = document.getElementById('cell-list');
        this.elTerminal = document.getElementById('can-terminal');
        this.elDemandVal = document.getElementById('demand-val');
        this.elAlertList = document.getElementById('alert-list');
        this.elDashboardContainer = document.querySelector('.dashboard-container');
        
        // Initialize cells
        this.initCellBars();
        
        // Settings
        this.maxTerminalLines = 50;
    }

    initCellBars() {
        this.elCellList.innerHTML = '';
        for (let i = 0; i < this.numCells; i++) {
            const item = document.createElement('div');
            item.className = 'cell-item';
            
            // Expected normal Li-ion range 3.0v to 4.2v
            item.innerHTML = `
                <div class="cell-header">
                    <span>CELL #${(i+1).toString().padStart(2, '0')}</span>
                    <span id="cell-val-${i}">0.000 V</span>
                </div>
                <div class="cell-bar-container">
                    <div class="cell-bar" id="cell-bar-${i}"></div>
                </div>
            `;
            this.elCellList.appendChild(item);
        }
    }

    updateHeader(packVoltage, packCurrent, maxTemp, ekfSoc) {
        this.elPackVoltage.textContent = `${packVoltage.toFixed(2)} V`;
        let sign = packCurrent > 0 ? "+" : (packCurrent < 0 ? "" : " "); // Keep alignment
        this.elPackCurrent.textContent = `${sign}${packCurrent.toFixed(1)} A`;
        this.elMaxTemp.textContent = `${maxTemp.toFixed(1)} °C`;
        this.elEkfSoc.textContent = `${ekfSoc.toFixed(2)} %`;
    }

    updateDemandSliderLabel(val) {
        let sign = val > 0 ? "+" : "";
        this.elDemandVal.textContent = `${sign}${val} A`;
        if (val > 0) this.elDemandVal.style.color = 'var(--accent-red)';
        else if (val < 0) this.elDemandVal.style.color = 'var(--accent-green)';
        else this.elDemandVal.style.color = 'var(--text-main)';
    }

    updateCells(cellsArray) {
        cellsArray.forEach((cell, i) => {
            const v = cell.Vt;
            const elVal = document.getElementById(`cell-val-${i}`);
            const elBar = document.getElementById(`cell-bar-${i}`);
            
            if (!elVal || !elBar) return;
            
            elVal.textContent = `${v.toFixed(3)} V`;
            
            // Map 3.0V -> 0%, 4.2V -> 100%
            let pct = ((v - 3.0) / (4.2 - 3.0)) * 100;
            pct = Math.max(0, Math.min(100, pct));
            elBar.style.width = `${pct}%`;
            
            // Color code
            if (v < 3.2) elBar.style.backgroundColor = 'var(--accent-red)';
            else if (v > 4.15) elBar.style.backgroundColor = 'var(--accent-cyan)';
            else elBar.style.backgroundColor = 'var(--accent-green)';
        });
    }

    logCanFrames(frames) {
        // frames is an array of { ts, text }
        frames.forEach(f => {
            const line = document.createElement('div');
            line.className = 'can-line';
            line.textContent = `[${f.ts.toString().padStart(6, '0')}] ${f.text}`;
            this.elTerminal.appendChild(line);
        });

        // Prune old lines
        while (this.elTerminal.childNodes.length > this.maxTerminalLines) {
            this.elTerminal.removeChild(this.elTerminal.firstChild);
        }

        // Auto scroll to bottom
        this.elTerminal.scrollTop = this.elTerminal.scrollHeight;
    }

    updateAlerts(faults) {
        if (faults.length === 0) {
            this.elAlertList.innerHTML = '<div class="alert-placeholder">SYSTEM NOMINAL</div>';
            this.elDashboardContainer.classList.remove('fault-critical');
            return;
        }

        const hasCritical = faults.some(f => f.level === 'CRITICAL');
        if (hasCritical) {
            this.elDashboardContainer.classList.add('fault-critical');
        } else {
            this.elDashboardContainer.classList.remove('fault-critical');
        }

        this.elAlertList.innerHTML = '';
        faults.forEach(f => {
            const item = document.createElement('div');
            item.className = `alert-item ${f.level === 'CRITICAL' ? 'alert-critical' : 'alert-warning'}`;
            item.innerHTML = `
                <span>[${f.type}] ${f.msg}</span>
                <span>${f.level}</span>
            `;
            this.elAlertList.appendChild(item);
        });
    }
}
