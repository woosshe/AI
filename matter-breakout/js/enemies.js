/**
 * enemies.js - 적(벽돌) 생성 및 관리
 */
window.Enemies = {
    list: [],
    gridSize: 40,
    cols: 8,
    
    ENEMY_TYPES: {
        NORMAL: { hp: 10, score: 100, color: 'silver', size: [40, 40], weight: 0.6 },
        ELITE: { hp: 30, score: 200, color: 'limegreen', size: [[80, 40], [40, 80]], weight: 0.2 },
        UNIQUE: { hp: 100, score: 500, color: 'dodgerblue', size: [[120, 40], [40, 120]], weight: 0.1 },
        SPECIAL: { hp: 300, score: 1000, color: 'mediumorchid', size: [80, 80], weight: 0.05 },
        BOSS: { hp: 2000, score: 10000, color: 'gold', size: [160, 160], weight: 0 }
    },

    init() {
        for(let i=0; i<3; i++) {
            this.spawnRow(i * (this.gridSize + 10) + 100);
        }
    },

    spawnRow(y = 100) {
        if (Game.turns % 20 === 0 && Game.turns > 0) {
            this.spawnBoss();
            return;
        }

        const occupied = new Array(this.cols).fill(false);
        const hpBonus = Math.floor(Game.turns / 5) * Game.ENEMY_HP_BONUS;

        for (let i = 0; i < this.cols; i++) {
            if (occupied[i] || Math.random() < 0.3) continue;

            let type = this.getRandomType();
            
            // 조건부 타입 제한
            if (type === this.ENEMY_TYPES.SPECIAL) {
                if (Game.turns < 10 || Game.specialEnemyCooldown > 0) {
                    type = this.ENEMY_TYPES.NORMAL;
                } else {
                    Game.specialEnemyCooldown = 5;
                }
            }

            const sizeData = Array.isArray(type.size[0]) ? type.size[Math.floor(Math.random() * type.size.length)] : type.size;
            const w = sizeData[0];
            const h = sizeData[1];
            const colSpan = Math.ceil(w / this.gridSize);
            
            if (i + colSpan > this.cols) continue;

            const x = i * this.gridSize + w / 2;
            const hp = type.hp + hpBonus;

            const brick = Bodies.rectangle(x, y, w - 4, h - 4, {
                isStatic: true,
                label: 'enemy',
                plugin: { hp, maxHp: hp, score: type.score, color: type.color, flash: 0, targetY: y }
            });

            this.list.push(brick);
            Composite.add(Game.engine.world, brick);
            for(let j=0; j<colSpan; j++) occupied[i+j] = true;
        }
    },

    getRandomType() {
        const rand = Math.random();
        let cumulative = 0;
        for (const key in this.ENEMY_TYPES) {
            cumulative += this.ENEMY_TYPES[key].weight;
            if (rand < cumulative) return this.ENEMY_TYPES[key];
        }
        return this.ENEMY_TYPES.NORMAL;
    },

    spawnBoss() {
        Game.bossActive = true;
        const type = this.ENEMY_TYPES.BOSS;
        const hp = type.hp + (Math.floor(Game.turns / 5) * Game.ENEMY_HP_BONUS);
        const boss = Bodies.rectangle(Game.WIDTH / 2, 120, type.size[0], type.size[1], {
            isStatic: true,
            label: 'enemy',
            plugin: { hp, maxHp: hp, score: type.score, color: type.color, flash: 0, isBoss: true, targetY: 120 }
        });
        this.list.push(boss);
        Composite.add(Game.engine.world, boss);
    },

    moveRowsDown() {
        const step = this.gridSize + 10;
        this.list.forEach(enemy => {
            enemy.plugin.targetY += step; // 목표 지점 업데이트
            if (enemy.plugin.targetY > Player.y - 20) {
                this.damagePlayer(enemy);
            }
        });
    },

    handleCollision(pair) {
        const { bodyA, bodyB } = pair;
        const enemy = bodyA.label === 'enemy' ? bodyA : (bodyB.label === 'enemy' ? bodyB : null);
        if (enemy) {
            enemy.plugin.hp -= Game.BALL_DAMAGE;
            enemy.plugin.flash = 5; // 피격 플래시
            if (enemy.plugin.hp <= 0) {
                this.destroyEnemy(enemy);
            }
        }
    },

    destroyEnemy(enemy) {
        Game.score += enemy.plugin.score;
        Leveling.gainXP(enemy.plugin.maxHp);
        if (enemy.plugin.isBoss) Game.bossActive = false;
        Composite.remove(Game.engine.world, enemy);
        this.list = this.list.filter(e => e !== enemy);
    },

    damagePlayer(enemy) {
        Player.hp -= Math.ceil(enemy.plugin.hp / 10);
        Player.hitEffect = 10;
        this.destroyEnemy(enemy);
    },

    update() {
        this.list.forEach(enemy => {
            // 피격 플래시 효과
            if(enemy.plugin.flash > 0) enemy.plugin.flash--;

            // 부드러운 하강 애니메이션
            if (enemy.plugin.targetY !== undefined) {
                const dy = enemy.plugin.targetY - enemy.position.y;
                if (Math.abs(dy) > 0.1) {
                    const nextY = enemy.position.y + dy * 0.1;
                    Body.setPosition(enemy, { x: enemy.position.x, y: nextY });
                }
            }
        });
    },

    draw(ctx) {
        this.list.forEach(enemy => {
            const { x, y } = enemy.position;
            const w = enemy.bounds.max.x - enemy.bounds.min.x - 4;
            const h = enemy.bounds.max.y - enemy.bounds.min.y - 4;

            ctx.fillStyle = enemy.plugin.flash > 0 ? '#ff0000' : enemy.plugin.color;
            ctx.fillRect(x - w/2, y - h/2, w, h);
            
            // 내부 HP 바
            const hpRatio = enemy.plugin.hp / enemy.plugin.maxHp;
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(x - w/2 + 5, y - h/2 + 5, w - 10, 4);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(x - w/2 + 5, y - h/2 + 5, (w - 10) * hpRatio, 4);

            // HP 텍스트
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(enemy.plugin.hp, x, y + 5);
        });
    }
};