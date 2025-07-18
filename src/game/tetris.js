export class TetrisGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.blockSize = 30;
        this.cols = 10;
        this.rows = 20;
        
        this.board = [];
        this.currentPiece = null;
        this.currentX = 0;
        this.currentY = 0;
        
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;
        
        this.isGameOver = false;
        this.isPaused = false;
        
        this.colors = [
            '#000000', // 0: 空
            '#00f0f0', // 1: I - シアン
            '#f0f000', // 2: O - 黄色
            '#a000f0', // 3: T - 紫
            '#00f000', // 4: S - 緑
            '#f00000', // 5: Z - 赤
            '#0000f0', // 6: J - 青
            '#f0a000'  // 7: L - オレンジ
        ];
        
        this.pieces = [
            [[1,1,1,1]],                    // I
            [[1,1],[1,1]],                  // O
            [[0,1,0],[1,1,1]],              // T
            [[0,1,1],[1,1,0]],              // S
            [[1,1,0],[0,1,1]],              // Z
            [[1,0,0],[1,1,1]],              // J
            [[0,0,1],[1,1,1]]               // L
        ];
        
        this.init();
    }
    
    init() {
        // ボードの初期化
        for (let row = 0; row < this.rows; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.board[row][col] = 0;
            }
        }
    }
    
    start() {
        this.init();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.isGameOver = false;
        this.isPaused = false;
        this.spawnPiece();
    }
    
    pause() {
        this.isPaused = true;
    }
    
    resume() {
        this.isPaused = false;
        this.lastTime = performance.now();
    }
    
    spawnPiece() {
        const pieceId = Math.floor(Math.random() * this.pieces.length);
        this.currentPiece = this.pieces[pieceId].map(row => [...row]);
        
        // ピースに色IDを設定
        for (let y = 0; y < this.currentPiece.length; y++) {
            for (let x = 0; x < this.currentPiece[y].length; x++) {
                if (this.currentPiece[y][x]) {
                    this.currentPiece[y][x] = pieceId + 1;
                }
            }
        }
        
        this.currentX = Math.floor((this.cols - this.currentPiece[0].length) / 2);
        this.currentY = 0;
        
        // 衝突チェック
        if (this.collision()) {
            this.isGameOver = true;
        }
    }
    
    collision(offsetX = 0, offsetY = 0, piece = this.currentPiece) {
        for (let y = 0; y < piece.length; y++) {
            for (let x = 0; x < piece[y].length; x++) {
                if (piece[y][x]) {
                    const newX = this.currentX + x + offsetX;
                    const newY = this.currentY + y + offsetY;
                    
                    if (newX < 0 || newX >= this.cols || newY >= this.rows) {
                        return true;
                    }
                    
                    if (newY >= 0 && this.board[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    merge() {
        for (let y = 0; y < this.currentPiece.length; y++) {
            for (let x = 0; x < this.currentPiece[y].length; x++) {
                if (this.currentPiece[y][x]) {
                    this.board[this.currentY + y][this.currentX + x] = this.currentPiece[y][x];
                }
            }
        }
    }
    
    rotate() {
        const rotated = [];
        const N = this.currentPiece.length;
        
        for (let i = 0; i < N; i++) {
            rotated[i] = [];
            for (let j = 0; j < N; j++) {
                rotated[i][j] = this.currentPiece[N - j - 1][i];
            }
        }
        
        if (!this.collision(0, 0, rotated)) {
            this.currentPiece = rotated;
        }
    }
    
    moveLeft() {
        if (!this.collision(-1, 0)) {
            this.currentX--;
        }
    }
    
    moveRight() {
        if (!this.collision(1, 0)) {
            this.currentX++;
        }
    }
    
    softDrop() {
        if (!this.collision(0, 1)) {
            this.currentY++;
            this.score++;
        }
    }
    
    drop() {
        if (!this.collision(0, 1)) {
            this.currentY++;
        } else {
            this.merge();
            this.checkLines();
            this.spawnPiece();
        }
    }
    
    checkLines() {
        let linesCleared = 0;
        
        for (let row = this.rows - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell !== 0)) {
                this.board.splice(row, 1);
                this.board.unshift(new Array(this.cols).fill(0));
                linesCleared++;
                row++; // 同じ行を再チェック
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += linesCleared * 100 * this.level;
            
            // レベルアップ
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
        }
    }
    
    update() {
        if (this.isPaused || this.isGameOver) return;
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.dropCounter += deltaTime;
        
        if (this.dropCounter > this.dropInterval) {
            this.drop();
            this.dropCounter = 0;
        }
    }
    
    render() {
        // 背景クリア
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // グリッド線
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 1;
        
        for (let row = 0; row <= this.rows; row++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, row * this.blockSize);
            this.ctx.lineTo(this.cols * this.blockSize, row * this.blockSize);
            this.ctx.stroke();
        }
        
        for (let col = 0; col <= this.cols; col++) {
            this.ctx.beginPath();
            this.ctx.moveTo(col * this.blockSize, 0);
            this.ctx.lineTo(col * this.blockSize, this.rows * this.blockSize);
            this.ctx.stroke();
        }
        
        // ボードの描画
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col]) {
                    this.drawBlock(col, row, this.colors[this.board[row][col]]);
                }
            }
        }
        
        // 現在のピースの描画
        if (this.currentPiece) {
            for (let y = 0; y < this.currentPiece.length; y++) {
                for (let x = 0; x < this.currentPiece[y].length; x++) {
                    if (this.currentPiece[y][x]) {
                        this.drawBlock(
                            this.currentX + x,
                            this.currentY + y,
                            this.colors[this.currentPiece[y][x]]
                        );
                    }
                }
            }
        }
        
        // ゲームオーバー表示
        if (this.isGameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    drawBlock(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            x * this.blockSize,
            y * this.blockSize,
            this.blockSize - 2,
            this.blockSize - 2
        );
        
        // ハイライト
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(
            x * this.blockSize,
            y * this.blockSize,
            this.blockSize - 2,
            4
        );
    }
}