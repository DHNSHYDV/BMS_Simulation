export class Matrix {
    constructor(rows, cols, data = null) {
        this.rows = rows;
        this.cols = cols;
        this.data = data || Array.from({ length: rows }, () => new Array(cols).fill(0));
    }

    static fromArray(arr) {
        return new Matrix(arr.length, arr[0].length, arr);
    }

    static fromVector(arr) {
        return new Matrix(arr.length, 1, arr.map(v => [v]));
    }

    toArray() {
        return this.data.map(row => [...row]);
    }

    get(row, col) {
        return this.data[row][col];
    }

    set(row, col, value) {
        this.data[row][col] = value;
    }

    add(other) {
        if (this.rows !== other.rows || this.cols !== other.cols) throw new Error('Dimensions mismatch for Matrix Add');
        const res = new Matrix(this.rows, this.cols);
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                res.data[i][j] = this.data[i][j] + other.data[i][j];
            }
        }
        return res;
    }

    subtract(other) {
        if (this.rows !== other.rows || this.cols !== other.cols) throw new Error('Dimensions mismatch for Matrix Subtract');
        const res = new Matrix(this.rows, this.cols);
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                res.data[i][j] = this.data[i][j] - other.data[i][j];
            }
        }
        return res;
    }

    multiply(other) {
        if (typeof other === 'number') {
            const res = new Matrix(this.rows, this.cols);
            for (let i = 0; i < this.rows; i++) {
                for (let j = 0; j < this.cols; j++) {
                    res.data[i][j] = this.data[i][j] * other;
                }
            }
            return res;
        }

        if (this.cols !== other.rows) throw new Error('Dimensions mismatch for Matrix Multiply');
        const res = new Matrix(this.rows, other.cols);
        for (let i = 0; i < res.rows; i++) {
            for (let j = 0; j < res.cols; j++) {
                let sum = 0;
                for (let k = 0; k < this.cols; k++) {
                    sum += this.data[i][k] * other.data[k][j];
                }
                res.data[i][j] = sum;
            }
        }
        return res;
    }

    transpose() {
        const res = new Matrix(this.cols, this.rows);
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                res.data[j][i] = this.data[i][j];
            }
        }
        return res;
    }

    // Simplistic inverse for small matrices (1x1 and 2x2 for EKF)
    inverse() {
        if (this.rows !== this.cols) throw new Error('Must be square matrix');
        if (this.rows === 1) {
            return new Matrix(1, 1, [[1 / this.data[0][0]]]);
        }
        if (this.rows === 2) {
            const a = this.data[0][0];
            const b = this.data[0][1];
            const c = this.data[1][0];
            const d = this.data[1][1];
            const det = a * d - b * c;
            if (det === 0) throw new Error('Matrix singular');
            return new Matrix(2, 2, [
                [d / det, -b / det],
                [-c / det, a / det]
            ]);
        }
        throw new Error('Inverse only implemented up to 2x2');
    }
}
