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
        const w = this.canvas.width;
        const h = this.canvas.height;
        const ctx = this.ctx;

        // Clear
        ctx.clearRect(0, 0, w, h);

        if (this.history.length < 2) return;

        // Draw Grid
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let y = 0; y <= h; y += h/4) {
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
        }
        for (let x = 0; x <= w; x += w/10) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
        }
        ctx.stroke();

        // Autoscale Y based on history min/max
        let minSoc = 100, maxSoc = 0;
        this.history.forEach(p => {
            minSoc = Math.min(minSoc, p.trueSoc, p.estSoc);
            maxSoc = Math.max(maxSoc, p.trueSoc, p.estSoc);
        });

        // Add margins to scale
        let yRange = maxSoc - minSoc;
        if (yRange < 2) { 
            // minimum 2% zoom range to show some flat line without going infinite
            yRange = 2; 
            minSoc -= 1; 
            maxSoc += 1;
        } else {
            minSoc -= yRange * 0.1;
            maxSoc += yRange * 0.1;
            yRange = maxSoc - minSoc;
        }

        const mapX = (idx) => (idx / (this.maxPoints - 1)) * w;
        const mapY = (soc) => h - ((soc - minSoc) / yRange) * h;

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
        // make it dashed to look cool
        ctx.setLineDash([5, 5]);
        this.history.forEach((p, idx) => {
            const x = mapX(idx + (this.maxPoints - this.history.length));
            const y = mapY(p.estSoc);
            if (idx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.setLineDash([]); // reset

        // Draw current values as text
        const latest = this.history[this.history.length - 1];
        ctx.fillStyle = '#fff';
        ctx.font = '12px "Share Tech Mono"';
        ctx.fillText(`True: ${latest.trueSoc.toFixed(2)}%`, 10, 20);
        ctx.fillText(`Est:  ${latest.estSoc.toFixed(2)}%`, 10, 35);
    }
}
