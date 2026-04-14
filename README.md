# BMS_Simulation: Intelligent BMS & State Estimator

A high-performance, browser-based **Lithium-ion Battery Management System (BMS)** simulator designed for real-time monitoring and advanced state estimation. This project was developed as a comprehensive engineering demonstration for **Embedded Systems in Electric Vehicles**.

![BMS Dashboard Screenshot](https://raw.githubusercontent.com/DHNSHYDV/BMS_Simulation/master/src/assets/hero.png)

## 🚀 Overview

This simulator provides a "Hardware-in-the-Loop" (HIL) experience, modeling a **16-cell series battery pack** (approx. 60V). It features a real-time physics engine, a **CAN Bus** telemetry stream, and a mathematically robust **Extended Kalman Filter (EKF)** for State of Charge (SOC) estimation.

### Key Features
- **Dynamic Physics Engine**: Models cell voltage sag, internal resistance ($R_0, R_1$), polarization capacitance ($C_1$), and thermal buildup ($I^2R$).
- **Extended Kalman Filter (EKF)**: Predicts the hidden State of Charge (SOC) by filtering noisy voltage measurements against a 1-RC equivalent circuit model.
- **CAN Bus Terminal**: Generates and broadcasts hexadecimal CAN frames (IDs `0x300`-`0x305`) mimicking a real vehicle network.
- **Interactive Load Demand**: Simulate real driving conditions (acceleration/braking) via a responsive current demand slider (-100A to +100A).
- **Engineering Dashboard**: A premium, dark-themed UI built with Vanilla JS/CSS for zero-latency monitoring.

---

## 🧪 Mathematical Background

### 1-RC Equivalent Circuit Model (ECM)
The simulation represents each cell using a standard 1-RC model:
- $V_t = V_{oc}(SOC) - V_{rc} - I \cdot R_0$
- $\dot{V}_{rc} = -\frac{1}{R_1 C_1} V_{rc} + \frac{1}{C_1} I$

### The Extended Kalman Filter (EKF)
The EKF handles the non-linear relationship between SOC and Open Circuit Voltage (OCV). It cycles through two main phases:
1. **Prediction**: $x_{k|k-1} = f(x_{k-1}, u_k)$ and $P_{k|k-1} = A P_{k-1} A^T + Q$
2. **Update**: $K_k = P_{k|k-1} H^T (H P_{k|k-1} H^T + R)^{-1}$ and $x_k = x_{k|k-1} + K_k(z_k - h(x_{k|k-1}, u_k))$

---

## 🛠️ Technical Stack
- **Core Logic**: Vanilla JavaScript (ES6 Modules)
- **Math Engine**: Custom Matrix math library for EKF operations.
- **Styling**: Vanilla CSS (Grids, Flexbox, Glassmorphism).
- **Visualization**: HTML5 Canvas for real-time SOC plotting.
- **Build Tool**: [Vite](https://vitejs.dev/) for ultra-fast development.

---

## 🏃 How to Run Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/DHNSHYDV/BMS_Simulation.git
   cd BMS_Simulation
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Launch the development server**:
   ```bash
   npm run dev
   ```

4. **Access the Dashboard**:
   Open your browser to `http://localhost:5173`.

---

## 📁 Project Structure
- `src/math/`: Matrix and EKF algorithm implementations.
- `src/sim/`: Battery physics engine and CAN Bus logic.
- `src/ui/`: Dashboard DOM management and Canvas charting.
- `main.js`: Main simulation loop and module orchestration.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
Developed by **Intern dhanu** for **Vision Astraa // BMS Telemetry Demo**.
