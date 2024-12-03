class GomokuGame {
    constructor() {
        this.boardSize = 15;
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(null));
        this.currentPlayer = 'black';
        this.gameOver = false;
        this.initializeBoard();
        this.setupEventListeners();
    }

    initializeBoard() {
        const boardElement = document.getElementById('board');
        boardElement.innerHTML = '';
        
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                boardElement.appendChild(cell);
            }
            boardElement.appendChild(document.createElement('br'));
        }
    }

    setupEventListeners() {
        const board = document.getElementById('board');
        board.addEventListener('click', (e) => {
            if (!e.target.classList.contains('cell') || this.gameOver) return;
            
            const row = parseInt(e.target.dataset.row);
            const col = parseInt(e.target.dataset.col);
            
            if (this.board[row][col]) return;
            
            this.makeMove(row, col);
        });

        document.getElementById('restart').addEventListener('click', () => {
            this.restartGame();
        });
    }

    makeMove(row, col) {
        this.board[row][col] = this.currentPlayer;
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add(this.currentPlayer);

        if (this.checkWin(row, col)) {
            document.getElementById('status').textContent = `游戏结束！${this.currentPlayer === 'black' ? '振河' : '建祥'}获胜！`;
            this.gameOver = true;
            return;
        }

        this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
        document.getElementById('status').textContent = `当前回合: ${this.currentPlayer === 'black' ? '振河' : '建祥'}`;
    }

    checkWin(row, col) {
        const directions = [
            [[0, 1], [0, -1]],  // 水平
            [[1, 0], [-1, 0]],  // 垂直
            [[1, 1], [-1, -1]], // 对角线
            [[1, -1], [-1, 1]]  // 反对角线
        ];

        return directions.some(dir => {
            const count = 1 + 
                this.countInDirection(row, col, dir[0][0], dir[0][1]) +
                this.countInDirection(row, col, dir[1][0], dir[1][1]);
            return count >= 5;
        });
    }

    countInDirection(row, col, deltaRow, deltaCol) {
        const player = this.board[row][col];
        let count = 0;
        let currentRow = row + deltaRow;
        let currentCol = col + deltaCol;

        while (
            currentRow >= 0 && currentRow < this.boardSize &&
            currentCol >= 0 && currentCol < this.boardSize &&
            this.board[currentRow][currentCol] === player
        ) {
            count++;
            currentRow += deltaRow;
            currentCol += deltaCol;
        }

        return count;
    }

    restartGame() {
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(null));
        this.currentPlayer = 'black';
        this.gameOver = false;
        document.getElementById('status').textContent = '当前回合: 振河';
        
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.remove('black', 'white');
        });
    }
}

// 初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    new GomokuGame();
});
