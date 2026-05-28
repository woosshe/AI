/**
 * balls.js - 공 관리 및 물리 처리
 */
window.Balls = {
    activeBalls: [],
    firstLandedX: null,
    isSpawning: false, // 공들이 순차 발사 중인지 여부

    init() {
        this.activeBalls = [];
        this.isSpawning = false;
    },

    launchAll(angle) {
        this.isSpawning = true;
        let spawnedCount = 0;

        for (let i = 0; i < Game.BALL_COUNT; i++) {
            setTimeout(() => {
                this.spawnBall(Player.x, Player.y - 20, angle);
                spawnedCount++;
                if (spawnedCount === Game.BALL_COUNT) {
                    this.isSpawning = false; // 마지막 공까지 발사 완료
                }
            }, i * 100);
        }
    },

    spawnBall(x, y, angle) {
        const ball = Bodies.circle(x, y, 8, {
            restitution: 1,
            friction: 0,
            frictionAir: 0,
            inertia: Infinity,
            label: 'ball',
            collisionFilter: {
                group: -1 // 음수 그룹이 같으면 서로 충돌하지 않고 관통함
            }
        });

        const velocity = {
            x: Math.cos(angle) * Game.BALL_SPEED,
            y: Math.sin(angle) * Game.BALL_SPEED
        };

        Body.setVelocity(ball, velocity);
        this.activeBalls.push(ball);
        Composite.add(Game.engine.world, ball);
    },

    recallAll() {
        // 남아있는 모든 공을 바닥으로 강제 이동시켜 소멸 유도
        this.activeBalls.forEach(ball => {
            Body.setVelocity(ball, { x: 0, y: Game.BALL_SPEED * 2 });
            // 벽 통과를 방지하기 위해 충돌 그룹을 일시적으로 변경하거나 센서로 만들 수 있으나, 
            // 여기서는 단순히 속도를 아래로 강하게 주어 바닥 처리를 유도합니다.
        });
    },

    update() {
        this.activeBalls = this.activeBalls.filter(ball => {
            // 일정한 속도 유지
            const speed = Vector.magnitude(ball.velocity);
            if (Math.abs(speed - Game.BALL_SPEED) > 0.1) {
                Body.setVelocity(ball, Vector.mult(Vector.normalise(ball.velocity), Game.BALL_SPEED));
            }

            // 화면 하단 소멸
            if (ball.position.y > Game.HEIGHT) {
                if (this.firstLandedX === null) {
                    this.firstLandedX = ball.position.x;
                    Player.moveTo(this.firstLandedX); // 첫 공이 닿자마자 패들 이동 시작
                }
                Composite.remove(Game.engine.world, ball);
                return false;
            }
            return true;
        });
    },

    draw(ctx) {
        ctx.fillStyle = '#ff6b6b';
        this.activeBalls.forEach(ball => {
            ctx.beginPath();
            ctx.arc(ball.position.x, ball.position.y, 8, 0, Math.PI * 2);
            ctx.fill();
        });
    }
};