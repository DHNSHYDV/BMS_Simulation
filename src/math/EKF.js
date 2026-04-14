import { Matrix } from './Matrix.js';

export class EKF {
    constructor(capacityAh, dt) {
        // Battery parameters (1-RC Model simplified constants)
        this.dt = dt; // Time step (s)
        this.Capacity = capacityAh * 3600; // Capacity in Coulomb
        this.R0 = 0.05; // Ohmic resistance (Ohms)
        this.R1 = 0.02; // Polarization resistance (Ohms)
        this.C1 = 1500;  // Polarization capacitance (Farads)
        this.tau = this.R1 * this.C1;
        this.expTau = Math.exp(-this.dt / this.tau);

        // State vector x = [SOC, V_rc]^T
        // Initial guess: SOC=80%, V_rc=0
        this.x = Matrix.fromVector([0.8, 0.0]); 

        // Error Covariance P
        this.P = Matrix.fromArray([
            [0.1, 0],
            [0, 0.1]
        ]);

        // Process noise covariance Q (trust model somewhat)
        this.Q = Matrix.fromArray([
            [1e-6, 0],
            [0, 1e-4]
        ]);

        // Measurement noise covariance R (V_t noise)
        this.R = Matrix.fromArray([[0.01]]); // Matrix 1x1
    }

    // OCV vs SOC lookup or curve. SOC is 0.0 to 1.0
    // Simplified heuristic Li-ion curve (NMC)
    getOCV(soc) {
        const s = Math.min(Math.max(soc, 0.001), 0.999);
        // Typical realistic-looking OCV curve: ~3.0V at 0%, ~4.2V at 100%
        return 3.0 + 0.8 * s + 0.4 * s * s; 
    }

    // Derivative of OCV with respect to SOC (dOCV/dSOC)
    getdOCVdSOC(soc) {
        const s = Math.min(Math.max(soc, 0.001), 0.999);
        return 0.8 + 0.8 * s;
    }

    // Predict step (time update)
    // I is current (positive for discharge, negative for charge)
    predict(current) {
        // x(k+1) = A * x(k) + B * u(k)
        // SOC(k+1) = SOC(k) - (dt / Capacity) * I
        // V_rc(k+1) = V_rc(k) * exp(-dt/tau) + R1 * (1 - exp(-dt/tau)) * I

        const A = Matrix.fromArray([
            [1, 0],
            [0, this.expTau]
        ]);

        const B = Matrix.fromVector([
            -this.dt / this.Capacity,
            this.R1 * (1 - this.expTau)
        ]);

        const u = current;

        // x = A*x + B*u
        this.x = A.multiply(this.x).add(B.multiply(u));

        // P = A*P*A^T + Q
        this.P = A.multiply(this.P).multiply(A.transpose()).add(this.Q);
    }

    // Update step (measurement update)
    // Vt_measured is the actual measured terminal voltage
    update(current, Vt_measured) {
        const soc_pred = this.x.get(0, 0);
        const vrc_pred = this.x.get(1, 0);

        // h(x, u) = OCV(SOC) - V_rc - R0 * I
        // NOTE: Our current definition: Positive I = Discharge, which reduces voltage -> - R0 * I
        const ocv = this.getOCV(soc_pred);
        const Vt_pred = ocv - vrc_pred - this.R0 * current;

        // Jacobian of h w.r.t x (H matrix)
        // H = [dOCV/dSOC, -1]
        const H = Matrix.fromArray([
            [this.getdOCVdSOC(soc_pred), -1]
        ]);

        // Innovation (Residual) y_tilde = Vt_measured - Vt_pred
        const y_tilde = Matrix.fromVector([Vt_measured - Vt_pred]);

        // Innovation covariance S = H * P * H^T + R
        const S = H.multiply(this.P).multiply(H.transpose()).add(this.R);

        // Kalman Gain K = P * H^T * S^-1
        const S_inv = S.inverse();
        const K = this.P.multiply(H.transpose()).multiply(S_inv);

        // x = x + K * y_tilde
        this.x = this.x.add(K.multiply(y_tilde));

        // P = (I_mat - K * H) * P
        const I_mat = Matrix.fromArray([[1, 0], [0, 1]]);
        this.P = I_mat.subtract(K.multiply(H)).multiply(this.P);

        // Bound SOC to [0, 1] as an arbitrary constraint 
        let updatedSoc = this.x.get(0, 0);
        if (updatedSoc > 1) this.x.set(0, 0, 1);
        if (updatedSoc < 0) this.x.set(0, 0, 0);
    }

    getEstimatedSOC() {
        return this.x.get(0, 0) * 100.0; // returns %
    }

    getEstimatedVrc() {
        return this.x.get(1, 0);
    }
}
