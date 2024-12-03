class GomokuGame {
    constructor() {
        this.boardSize = 15;
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(null));
        this.currentPlayer = 'black';
        this.gameOver = false;
        this.socket = null;
        this.role = null;
        this.roomId = null;

        // 初始化UI元素
        this.boardElement = document.getElementById('board');
        this.statusElement = document.getElementById('status');
        this.restartButton = document.getElementById('restart');
        this.roomIdInput = document.getElementById('room-id');
        this.joinRoomButton = document.getElementById('join-room');
        this.shareLinkDiv = document.getElementById('share-link');
        this.roomLinkSpan = document.getElementById('room-link');
        this.copyLinkButton = document.getElementById('copy-link');

        this.initializeBoard();
        this.setupEventListeners();
        this.initializeSocket();
    }

    initializeSocket() {
        // 连接到游戏服务器
        const serverUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000'
            : 'https://gomoku-server-vf1p.onrender.com';
        this.socket = io(serverUrl);

        // 处理连接事件
        this.socket.on('connect', () => {
            console.log('已连接到服务器');
        });

        // 处理游戏状态更新
        this.socket.on('gameState', ({ role, board, currentPlayer, roomId }) => {
            this.role = role;
            this.board = board;
            this.currentPlayer = currentPlayer;
            this.roomId = roomId;
            this.updateBoard();
            this.updateStatus();
            
            // 显示分享链接
            this.showShareLink();
        });

        // 处理游戏开始
        this.socket.on('gameStart', ({ players }) => {
            this.updateStatus();
            this.restartButton.style.display = 'inline-block';
        });

        // 处理棋盘更新
        this.socket.on('updateBoard', ({ board, currentPlayer, lastMove }) => {
            this.board = board;
            this.currentPlayer = currentPlayer;
            this.updateBoard();
            this.updateStatus();
            this.checkWin(lastMove.row, lastMove.col, lastMove.player);
        });

        // 处理游戏重启
        this.socket.on('gameRestart', ({ board, currentPlayer }) => {
            this.board = board;
            this.currentPlayer = currentPlayer;
            this.gameOver = false;
            this.updateBoard();
            this.updateStatus();
        });

        // 处理玩家离开
        this.socket.on('playerLeft', ({ playerId }) => {
            this.statusElement.textContent = '对方已离开游戏';
            this.restartButton.style.display = 'none';
        });
    }

    initializeBoard() {
        this.boardElement.innerHTML = '';
        const table = document.createElement('table');
        table.style.borderCollapse = 'collapse';
        
        for (let i = 0; i < this.boardSize; i++) {
            const row = document.createElement('tr');
            for (let j = 0; j < this.boardSize; j++) {
                const cell = document.createElement('td');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                row.appendChild(cell);
            }
            table.appendChild(row);
        }
        
        this.boardElement.appendChild(table);
    }

    setupEventListeners() {
        this.boardElement.addEventListener('click', (e) => {
            if (this.gameOver) return;
            
            const cell = e.target.closest('.cell');
            if (!cell) return;

            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);

            // 检查是否轮到该玩家
            if (this.socket && 
                ((this.role === 'player1' && this.currentPlayer === this.socket.id) ||
                 (this.role === 'player2' && this.currentPlayer === this.socket.id))) {
                this.makeMove(row, col);
            }
        });

        this.restartButton.addEventListener('click', () => {
            if (this.socket && (this.role === 'player1' || this.role === 'player2')) {
                this.socket.emit('restart', this.roomId);
            }
        });

        this.joinRoomButton.addEventListener('click', () => {
            const roomId = this.roomIdInput.value.trim();
            if (roomId) {
                this.socket.emit('joinRoom', roomId);
            }
        });

        this.copyLinkButton.addEventListener('click', () => {
            navigator.clipboard.writeText(this.roomLinkSpan.textContent)
                .then(() => alert('链接已复制到剪贴板'));
        });

        // 检查URL中是否有房间ID
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('room');
        if (roomId) {
            this.roomIdInput.value = roomId;
            this.socket.emit('joinRoom', roomId);
        }
    }

    makeMove(row, col) {
        if (this.board[row][col] === null) {
            this.socket.emit('move', {
                roomId: this.roomId,
                row: row,
                col: col
            });
        }
    }

    updateBoard() {
        const cells = this.boardElement.getElementsByClassName('cell');
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const cell = cells[i * this.boardSize + j];
                const value = this.board[i][j];
                cell.className = `cell${value ? ' ' + value : ''}`;
            }
        }
    }

    updateStatus() {
        let status = '';
        if (this.gameOver) {
            status = `游戏结束，${this.currentPlayer === 'black' ? '白方' : '黑方'}胜利！`;
        } else if (!this.role) {
            status = '等待加入房间...';
        } else if (this.role === 'spectator') {
            status = '您正在观战';
        } else if (this.currentPlayer === this.socket.id) {
            status = '轮到你下棋';
        } else {
            status = '等待对方下棋';
        }
        this.statusElement.textContent = status;
    }

    showShareLink() {
        const gameUrl = `${window.location.origin}${window.location.pathname}?room=${this.roomId}`;
        this.roomLinkSpan.textContent = gameUrl;
        this.shareLinkDiv.style.display = 'block';
    }

    checkWin(row, col, player) {
        const directions = [
            [[0, 1], [0, -1]],   // 水平
            [[1, 0], [-1, 0]],   // 垂直
            [[1, 1], [-1, -1]],  // 主对角线
            [[1, -1], [-1, 1]]   // 副对角线
        ];

        for (const direction of directions) {
            let count = 1;
            for (const [dx, dy] of direction) {
                let r = row + dx;
                let c = col + dy;
                while (
                    r >= 0 && r < this.boardSize &&
                    c >= 0 && c < this.boardSize &&
                    this.board[r][c] === player
                ) {
                    count++;
                    r += dx;
                    c += dy;
                }
            }
            if (count >= 5) {
                this.gameOver = true;
                this.updateStatus();
                break;
            }
        }
    }
}

// 启动游戏
document.addEventListener('DOMContentLoaded', () => {
    new GomokuGame();
});
