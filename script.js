document.addEventListener('DOMContentLoaded', () => {
    // 获取画布和上下文
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // 游戏参数
    const gridSize = 20;
    const gridWidth = canvas.width / gridSize;
    const gridHeight = canvas.height / gridSize;
    
    // 游戏状态
    let score = 0;
    let highScore = localStorage.getItem('snakeHighScore') || 0;
    const baseGameSpeed = 150; // 基准速度（毫秒）
    let speedMultiplier = 0.3; // 初始速度为基准速度的30%
    let speedValue = 1.0; // 显示的速度值
    let gameSpeed = Math.round(baseGameSpeed / speedMultiplier); // 当前游戏速度
    let gameInterval;
    let isPaused = false;
    let isGameOver = false;
    
    // 障碍物相关
    let obstacles = [];
    const obstacleColor = '#9575cd'; // 淡紫色障碍物
    let lastObstacleScore = 0; // 上次添加障碍物时的分数
    const initialObstacleCount = 2; // 初始障碍物数量
    
    // 蛇的初始状态
    let snake = [
        {x: Math.floor(gridWidth / 2), y: Math.floor(gridHeight / 2)}
    ];
    
    // 初始方向（右）
    let direction = 'right';
    let nextDirection = 'right';
    
    // 食物位置
    let food = generateFood();
    
    // 更新分数和速度显示
    document.getElementById('score').textContent = score;
    document.getElementById('highScore').textContent = highScore;
    document.getElementById('speedValue').textContent = speedValue.toFixed(1);
    
    // 按钮控制
    const playPauseBtn = document.getElementById('playPauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    // 方向按钮
    const upBtn = document.getElementById('upBtn');
    const downBtn = document.getElementById('downBtn');
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    
    playPauseBtn.addEventListener('click', togglePlayPause);
    resetBtn.addEventListener('click', resetGame);
    
    // 添加方向按钮事件监听
    upBtn.addEventListener('click', () => changeDirection('up'));
    downBtn.addEventListener('click', () => changeDirection('down'));
    leftBtn.addEventListener('click', () => changeDirection('left'));
    rightBtn.addEventListener('click', () => changeDirection('right'));
    
    // 键盘控制
    document.addEventListener('keydown', handleKeyPress);
    
    // 初始绘制游戏
    // 添加初始障碍物
    generateObstacles(initialObstacleCount);
    drawGame();
    
    // 开始/暂停游戏切换
    function togglePlayPause() {
        if (isGameOver) {
            resetGame();
            return;
        }
        
        if (!gameInterval) {
            // 开始游戏
            gameInterval = setInterval(gameLoop, gameSpeed);
            playPauseBtn.textContent = '⏸';
            isPaused = false;
        } else {
            // 暂停/继续游戏
            if (isPaused) {
                gameInterval = setInterval(gameLoop, gameSpeed);
                playPauseBtn.textContent = '⏸';
                isPaused = false;
            } else {
                clearInterval(gameInterval);
                gameInterval = null;
                playPauseBtn.textContent = '▶';
                isPaused = true;
                
                // 在画布上显示暂停文本
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'white';
                ctx.font = '30px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('游戏已暂停', canvas.width / 2, canvas.height / 2);
            }
        }
    }
    
    // 重置游戏
    function resetGame() {
        clearInterval(gameInterval);
        gameInterval = null;
        
        // 重置游戏状态
        score = 0;
        document.getElementById('score').textContent = score;
        
        // 重置速度
        speedMultiplier = 0.3;
        speedValue = 1.0;
        document.getElementById('speedValue').textContent = speedValue.toFixed(1);
        gameSpeed = Math.round(baseGameSpeed / speedMultiplier);
        
        snake = [
            {x: Math.floor(gridWidth / 2), y: Math.floor(gridHeight / 2)}
        ];
        
        direction = 'right';
        nextDirection = 'right';
        food = generateFood();
        
        // 清除障碍物并添加初始障碍物
        obstacles = [];
        lastObstacleScore = 0;
        generateObstacles(initialObstacleCount);
        
        isGameOver = false;
        isPaused = false;
        playPauseBtn.textContent = '▶';
        
        drawGame();
    }
    
    // 游戏主循环
    function gameLoop() {
        if (isGameOver) return;
        
        // 更新方向
        direction = nextDirection;
        
        // 移动蛇
        moveSnake();
        
        // 检查碰撞
        if (checkCollision()) {
            gameOver();
            return;
        }
        
        // 检查是否吃到食物
        if (snake[0].x === food.x && snake[0].y === food.y) {
            // 增加分数
            score++;
            document.getElementById('score').textContent = score;
            
            // 更新最高分
            if (score > highScore) {
                highScore = score;
                document.getElementById('highScore').textContent = highScore;
                localStorage.setItem('snakeHighScore', highScore);
            }
            
            // 不移除尾部，让蛇变长
            food = generateFood();
            
            // 每增加10分，添加2个障碍物
            if (Math.floor(score / 10) > Math.floor(lastObstacleScore / 10)) {
                generateObstacles(2);
                lastObstacleScore = score;
            }
            
            // 增加速度值和速度倍率
            speedMultiplier = 0.3 + (score * 0.03); // 初始30%，每分增加3%（相当于0.1的速度值增加）
            speedValue = 1.0 + (score * 0.1); // 速度值显示，初始1.0，每分增加0.1
            document.getElementById('speedValue').textContent = speedValue.toFixed(1);
            
            // 更新游戏速度
            gameSpeed = Math.round(baseGameSpeed / speedMultiplier);
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, gameSpeed);
        } else {
            // 移除尾部
            snake.pop();
        }
        
        // 绘制游戏
        drawGame();
    }
    
    // 移动蛇
    function moveSnake() {
        const head = {x: snake[0].x, y: snake[0].y};
        
        switch (direction) {
            case 'up':
                head.y--;
                break;
            case 'down':
                head.y++;
                break;
            case 'left':
                head.x--;
                break;
            case 'right':
                head.x++;
                break;
        }
        
        // 在头部添加新位置
        snake.unshift(head);
    }
    
    // 检查碰撞
    function checkCollision() {
        const head = snake[0];
        
        // 检查是否撞墙
        if (head.x < 0 || head.x >= gridWidth || head.y < 0 || head.y >= gridHeight) {
            return true;
        }
        
        // 检查是否撞到自己（从第二个身体部分开始检查）
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                return true;
            }
        }
        
        // 检查是否撞到障碍物
        for (let obstacle of obstacles) {
            if (head.x === obstacle.x && head.y === obstacle.y) {
                return true;
            }
        }
        
        return false;
    }
    
    // 游戏结束
    function gameOver() {
        clearInterval(gameInterval);
        gameInterval = null;
        isGameOver = true;
        
        // 绘制游戏结束画面
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('游戏结束', canvas.width / 2, canvas.height / 2 - 30);
        
        ctx.font = '20px Arial';
        ctx.fillText(`最终得分: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillText('按"开始游戏"重新开始', canvas.width / 2, canvas.height / 2 + 50);
        
        startBtn.textContent = '重新开始';
    }
    
    // 生成食物
    function generateFood() {
        let newFood;
        let foodOnSnake;
        let foodOnObstacle;
        
        do {
            foodOnSnake = false;
            foodOnObstacle = false;
            newFood = {
                x: Math.floor(Math.random() * gridWidth),
                y: Math.floor(Math.random() * gridHeight)
            };
            
            // 确保食物不会出现在蛇身上
            for (let segment of snake) {
                if (segment.x === newFood.x && segment.y === newFood.y) {
                    foodOnSnake = true;
                    break;
                }
            }
            
            // 确保食物不会出现在障碍物上
            if (!foodOnSnake) {
                for (let obstacle of obstacles) {
                    if (obstacle.x === newFood.x && obstacle.y === newFood.y) {
                        foodOnObstacle = true;
                        break;
                    }
                }
            }
        } while (foodOnSnake || foodOnObstacle);
        
        return newFood;
    }
    
    // 生成障碍物
    function generateObstacles(count) {
        for (let i = 0; i < count; i++) {
            let newObstacle;
            let obstacleOnSnake;
            let obstacleOnFood;
            let obstacleOnObstacle;
            
            do {
                obstacleOnSnake = false;
                obstacleOnFood = false;
                obstacleOnObstacle = false;
                
                newObstacle = {
                    x: Math.floor(Math.random() * gridWidth),
                    y: Math.floor(Math.random() * gridHeight)
                };
                
                // 确保障碍物不会出现在蛇身上
                for (let segment of snake) {
                    if (segment.x === newObstacle.x && segment.y === newObstacle.y) {
                        obstacleOnSnake = true;
                        break;
                    }
                }
                
                // 确保障碍物不会出现在食物上
                if (!obstacleOnSnake && newObstacle.x === food.x && newObstacle.y === food.y) {
                    obstacleOnFood = true;
                }
                
                // 确保障碍物不会出现在其他障碍物上
                if (!obstacleOnSnake && !obstacleOnFood) {
                    for (let obstacle of obstacles) {
                        if (obstacle.x === newObstacle.x && obstacle.y === newObstacle.y) {
                            obstacleOnObstacle = true;
                            break;
                        }
                    }
                }
                
                // 确保障碍物不会出现在蛇头周围的安全区域
                const safeDistance = 2;
                const head = snake[0];
                if (!obstacleOnSnake && !obstacleOnFood && !obstacleOnObstacle) {
                    const distX = Math.abs(newObstacle.x - head.x);
                    const distY = Math.abs(newObstacle.y - head.y);
                    if (distX <= safeDistance && distY <= safeDistance) {
                        obstacleOnSnake = true; // 重用此变量表示在安全区域内
                    }
                }
                
            } while (obstacleOnSnake || obstacleOnFood || obstacleOnObstacle);
            
            obstacles.push(newObstacle);
        }
    }
    
    // 处理键盘输入
    function handleKeyPress(event) {
        const key = event.key;
        
        // 防止反方向移动
        switch (key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                if (direction !== 'down') nextDirection = 'up';
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                if (direction !== 'up') nextDirection = 'down';
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                if (direction !== 'right') nextDirection = 'left';
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                if (direction !== 'left') nextDirection = 'right';
                break;
            case ' ': // 空格键暂停/继续
                togglePause();
                break;
        }
    }
    
    // 方向按钮控制
    function changeDirection(newDirection) {
        // 防止反方向移动
        if (
            (newDirection === 'up' && direction !== 'down') ||
            (newDirection === 'down' && direction !== 'up') ||
            (newDirection === 'left' && direction !== 'right') ||
            (newDirection === 'right' && direction !== 'left')
        ) {
            nextDirection = newDirection;
        }
    }
    
    // 绘制游戏
    function drawGame() {
        // 清除画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制障碍物
        obstacles.forEach(obstacle => {
            // 使用渐变色填充障碍物
            const gradient = ctx.createLinearGradient(
                obstacle.x * gridSize, 
                obstacle.y * gridSize, 
                obstacle.x * gridSize + gridSize, 
                obstacle.y * gridSize + gridSize
            );
            gradient.addColorStop(0, '#9575cd');
            gradient.addColorStop(1, '#7e57c2');
            
            ctx.fillStyle = gradient;
            
            // 绘制圆角矩形
            const radius = 5;
            const x = obstacle.x * gridSize;
            const y = obstacle.y * gridSize;
            const width = gridSize - 1;
            const height = gridSize - 1;
            
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.fill();
            
            // 添加闪光效果
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(x + width/4, y + height/4, width/6, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // 绘制蛇
        snake.forEach((segment, index) => {
            // 蛇头和身体使用不同颜色
            if (index === 0) {
                ctx.fillStyle = '#ec407a'; // 粉红色蛇头
            } else {
                // 渐变色蛇身 - 粉色到紫色渐变
                const pinkValue = Math.floor(236 - (index * 5)) % 100 + 155;
                const purpleValue = Math.floor(100 + (index * 5)) % 100 + 100;
                ctx.fillStyle = `rgb(${pinkValue}, ${purpleValue}, 200)`;
            }
            
            ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 1, gridSize - 1);
            
            // 为蛇头添加眼睛
            if (index === 0) {
                ctx.fillStyle = '#f8bbd0'; // 淡粉色眼睛
                
                // 根据方向绘制眼睛
                const eyeSize = gridSize / 5;
                const eyeOffset = gridSize / 3;
                
                if (direction === 'right' || direction === 'left') {
                    // 水平方向的眼睛位置
                    const eyeX = segment.x * gridSize + (direction === 'right' ? gridSize - eyeOffset : eyeOffset - eyeSize);
                    ctx.fillRect(eyeX, segment.y * gridSize + eyeOffset - eyeSize, eyeSize, eyeSize);
                    ctx.fillRect(eyeX, segment.y * gridSize + gridSize - eyeOffset, eyeSize, eyeSize);
                } else {
                    // 垂直方向的眼睛位置
                    const eyeY = segment.y * gridSize + (direction === 'down' ? gridSize - eyeOffset : eyeOffset - eyeSize);
                    ctx.fillRect(segment.x * gridSize + eyeOffset - eyeSize, eyeY, eyeSize, eyeSize);
                    ctx.fillRect(segment.x * gridSize + gridSize - eyeOffset, eyeY, eyeSize, eyeSize);
                }
            }
        });
        
        // 绘制食物 - 五角星
        const centerX = food.x * gridSize + gridSize / 2;
        const centerY = food.y * gridSize + gridSize / 2;
        const size = gridSize / 2;
        
        // 创建渐变色
        const gradient = ctx.createRadialGradient(
            centerX, centerY, size * 0.2,
            centerX, centerY, size
        );
        gradient.addColorStop(0, '#f48fb1');
        gradient.addColorStop(1, '#ec407a');
        
        ctx.fillStyle = gradient;
        
        // 计算呼吸效果的缩放因子
        const breatheFactor = 0.9 + 0.1 * Math.sin(Date.now() / 500); // 呼吸效果周期约为3秒
        const starSize = size * breatheFactor;
        
        // 绘制五角星
        ctx.beginPath();
        // 五角星有5个顶点
        for (let i = 0; i < 5; i++) {
            // 外角点
            const outerAngle = (Math.PI / 2) + (Math.PI * 2 / 5) * i;
            const outerX = centerX + Math.cos(outerAngle) * starSize;
            const outerY = centerY + Math.sin(outerAngle) * starSize;
            
            if (i === 0) {
                ctx.moveTo(outerX, outerY);
            } else {
                ctx.lineTo(outerX, outerY);
            }
            
            // 内角点
            const innerAngle = (Math.PI / 2) + (Math.PI * 2 / 5) * i + (Math.PI / 5);
            const innerX = centerX + Math.cos(innerAngle) * (starSize * 0.4);
            const innerY = centerY + Math.sin(innerAngle) * (starSize * 0.4);
            
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
        
        // 添加食物光泽
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(centerX - starSize * 0.2, centerY - starSize * 0.2, starSize * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }
});