export class EKFChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.history = []; // Array of {trueSoc, estSoc}
        this.maxPoints = 200; // How many ticks to show on X axis
        
        // Handle resizing
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.draw();
    }

    pushData(trueSoc, estSoc) {
        this.history.push({ trueSoc, estSoc });
        if (this.history.length > this.maxPoints) {
            this.history.shift();
        }
    }

    draw() {
        // Margins for labels
        const marginL = 40;
        const marginB = 30;
        const w = this.canvas.width - marginL - 10;
        const h = this.canvas.height - marginB - 10;
        const ctx = this.ctx;

        // Clear
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.history.length < 2) return;

        // Autoscale Y based on history min/max
        let minSoc = 100, maxSoc = 0;
        this.history.forEach(p => {
            minSoc = Math.min(minSoc, p.trueSoc, p.estSoc);
            maxSoc = Math.max(maxSoc, p.trueSoc, p.estSoc);
        });

        // Add margins to scale
        let yRange = maxSoc - minSoc;
        if (yRange < 2) { 
            yRange = 2; 
            minSoc -= 1; 
            maxSoc += 1;
        } else {
            minSoc -= yRange * 0.1;
            maxSoc += yRange * 0.1;
            yRange = maxSoc - minSoc;
        }

        const mapX = (idx) => marginL + (idx / (this.maxPoints - 1)) * w;
        const mapY = (soc) => h - ((soc - minSoc) / yRange) * h;

        // Draw Grid and Axis Labels
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
        ctx.lineWidth = 1;
        ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
        ctx.font = '10px "Share Tech Mono"';
        ctx.textAlign = 'right';

        // Y-Axis Labels (SOC %)
        for (let i = 0; i <= 4; i++) {
            const yVal = minSoc + (yRange * i / 4);
            const canvasY = mapY(yVal);
            ctx.beginPath();
            ctx.moveTo(marginL, canvasY);
            ctx.lineTo(marginL + w, canvasY);
            ctx.stroke();
            ctx.fillText(`${yVal.toFixed(1)}%`, marginL - 5, canvasY + 3);
        }

        // X-Axis Labels (Time History)
        ctx.textAlign = 'center';
        // 200 points * 0.05s = 10 seconds total history
        for (let i = 0; i <= 4; i++) {
            const xPos = marginL + (w * i / 4);
            const timeVal = (i - 4) * 2.5; // -10s, -7.5s, -5s, -2.5s, 0s
            ctx.beginPath();
            ctx.moveTo(xPos, 0);
            ctx.lineTo(xPos, h);
            ctx.stroke();
            ctx.fillText(`${timeVal > 0 ? '+' : ''}${timeVal}s`, xPos, h + 15);
        }

        // Draw True SOC
        ctx.beginPath();
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 2;
        this.history.forEach((p, idx) => {
            const x = mapX(idx + (this.maxPoints - this.history.length));
            const y = mapY(p.trueSoc);
            if (idx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Draw Est SOC
        ctx.beginPath();
        ctx.strokeStyle = '#0ff'; // Cyan
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        this.history.forEach((p, idx) => {
            const x = mapX(idx + (this.maxPoints - this.history.length));
            const y = mapY(p.estSoc);
            if (idx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.setLineDash([]); // reset

        // Corner Readout (Top Left)
        const latest = this.history[this.history.length - 1];
        ctx.fillStyle = 'rgba(2, 6, 23, 0.8)';
        ctx.fillRect(marginL + 10, 10, 110, 45);
        ctx.strokeStyle = 'rgba(0,255,255,0.3)';
        ctx.strokeRect(marginL + 10, 10, 110, 45);

        ctx.fillStyle = '#fff';
        ctx.font = '12px "Share Tech Mono"';
        ctx.textAlign = 'left';
        ctx.fillText(`TRUE: ${latest.trueSoc.toFixed(2)}%`, marginL + 15, 27);
        ctx.fillText(`EST:  ${latest.estSoc.toFixed(2)}%`, marginL + 15, 43);
    }
}
