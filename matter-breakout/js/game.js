/**
 * game.js - 메인 제어 및 오케스트레이션
 */
const { Engine, Render, Runner, Bodies, Composite, Events, Body, Vector } = Matter;

window.Game = {
    // 핵심 설정 (전역 변수)
    WIDTH: 800,
    HEIGHT: 600,
    BALL_SPEED: 8,
    BALL_DAMAGE: 10,
    BALL_COUNT: 5,
    ENEMY_HP_BONUS: 50,
    
    // 상태 변수
    engine: null,
    render: null,
    canvas: null,
    ctx: null,
    score: 0,
    turns: 1,
    isLaunched: false,
    aimAngle: -Math.PI / 2,
    lastLaunchTime: 0,
    isPaused: false,
    specialEnemyCooldown: 0,
    bossActive: false,

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.canvas.width = this.WIDTH;
        this.canvas.height = this.HEIGHT;
        this.ctx = this.canvas.getContext('2d');

        this.engine = Engine.create();
        this.engine.gravity.y = 0; // 무중력

        // 각 시스템 초기화
        Player.init();
        Enemies.init();
        Balls.init();
        Leveling.init();
        Skills.init(); // Skills 모듈 초기화 추가
        Items.init();   // Items 모듈 초기화 추가

        this.createWalls();
        this.setupEvents();

        // 게임 시작 시 첫 턴의 적들이 발사 전 미리 한 칸 내려오도록 처리
        this.nextTurnStage();
        this.loop();
    },

    createWalls() {
        const wallOptions = { isStatic: true, friction: 0, restitution: 1 };
        const thickness = 100;
        Composite.add(this.engine.world, [
            Bodies.rectangle(this.WIDTH / 2, -thickness / 2, this.WIDTH, thickness, wallOptions), // 천장
            Bodies.rectangle(-thickness / 2, this.HEIGHT / 2, thickness, this.HEIGHT, wallOptions), // 왼쪽
            Bodies.rectangle(this.WIDTH + thickness / 2, this.HEIGHT / 2, thickness, this.HEIGHT, wallOptions) // 오른쪽
        ]);
    },

    setupEvents() {
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isLaunched || this.isPaused) return;
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            this.aimAngle = Math.atan2(my - (Player.y - 20), mx - Player.x);
        });

        this.canvas.addEventListener('click', () => {
            if (!this.isLaunched && !this.isPaused) {
                this.isLaunched = true;
                this.lastLaunchTime = Date.now();
                Balls.launchAll(this.aimAngle);
            }
        });

        Events.on(this.engine, 'collisionStart', (event) => {
            event.pairs.forEach(pair => {
                Enemies.handleCollision(pair);
            });
        });

        document.getElementById('call-balls-btn').addEventListener('click', () => {
            Balls.recallAll();
        });
    },

    update() {
        if (this.isPaused) return;

        // 배속 및 공 부르기 로직
        let timeScale = 1;
        if (this.isLaunched) {
            const elapsed = (Date.now() - this.lastLaunchTime) / 1000;
            const indicator = document.getElementById('speed-indicator');
            const callBtn = document.getElementById('call-balls-container');

            if (elapsed > 20) {
                timeScale = 10;
                indicator.style.display = 'block';
                indicator.textContent = 'SPEED UP x10';
            } else if (elapsed > 10) {
                timeScale = 5;
                indicator.style.display = 'block';
                indicator.textContent = 'SPEED UP x5';
            } else {
                indicator.style.display = 'none';
            }

            if (elapsed > 5) callBtn.style.display = 'block';
            else callBtn.style.display = 'none';
        } else {
            document.getElementById('speed-indicator').style.display = 'none';
            document.getElementById('call-balls-container').style.display = 'none';
        }

        Engine.update(this.engine, (1000 / 60) * timeScale);
        Balls.update();
        Enemies.update();
        Player.update();
        
        // 마지막 공까지 발사가 완료되었고, 필드에 공이 하나도 없으면 턴 종료
        if (this.isLaunched && !Balls.isSpawning && Balls.activeBalls.length === 0) {
            this.endTurn();
        }

        // 적이 한마리도 없으면 강제 회수
        if (this.isLaunched && Enemies.list.length === 0) {
            Balls.recallAll();
        }
    },

    draw() {
        this.ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
        
        Enemies.draw(this.ctx);
        Balls.draw(this.ctx);
        Player.draw(this.ctx);
        
        if (!this.isLaunched && !this.isPaused) this.drawAimLine();
    },

    drawAimLine() {
        this.ctx.beginPath();
        this.ctx.setLineDash([5, 5]);
        this.ctx.moveTo(Player.x, Player.y - 20);
        this.ctx.lineTo(Player.x + Math.cos(this.aimAngle) * 100, (Player.y - 20) + Math.sin(this.aimAngle) * 100);
        this.ctx.strokeStyle = '#fff';
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    },

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    },

    endTurn() {
        this.isLaunched = false;
        this.turns++;
        
        if (this.specialEnemyCooldown > 0) this.specialEnemyCooldown--;

        // 레벨업 체크 후 턴 진행
        if (Leveling.pendingUpgrades > 0) {
            Leveling.showModal();
        } else {
            this.nextTurnStage();
        }
    },

    nextTurnStage() {
        // 적들을 먼저 한 칸 내린 후, 빈 공간에 새로운 적을 생성하여 겹침 방지 및 '발사 전 이동' 구현
        Enemies.moveRowsDown();
        if (!this.bossActive) Enemies.spawnRow();
        this.updateHUD();
    },

    updateHUD() {
        document.getElementById('score').textContent = Math.floor(this.score);
        document.getElementById('level').textContent = Leveling.level;
        document.getElementById('turns').textContent = this.turns;
        document.getElementById('atk').textContent = this.BALL_DAMAGE;
        document.getElementById('ball-count').textContent = this.BALL_COUNT;
    }
};

window.onload = () => Game.init();