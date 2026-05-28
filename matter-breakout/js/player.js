/**
 * player.js - 플레이어 캐릭터 (패들) 로직
 */
window.Player = {
    x: 400,
    y: 580,
    width: 40,
    height: 40,
    hp: 1000,
    maxHp: 1000,
    hitEffect: 0,

    init() {
        this.x = Game.WIDTH / 2;
        this.y = Game.HEIGHT - this.height / 2;
    },

    moveTo(targetX) {
        this.targetX = targetX;
    },

    update() {
        if (this.targetX !== undefined) {
            this.x += (this.targetX - this.x) * 0.1;
            if (Math.abs(this.targetX - this.x) < 1) this.x = this.targetX;
        }
        if (this.hitEffect > 0) this.hitEffect--;
    },

    draw(ctx) {
        let drawX = this.x;
        if (this.hitEffect > 0) drawX += (Math.random() - 0.5) * 10;

        ctx.fillStyle = this.hitEffect > 0 ? '#ff0000' : '#00ffcc';
        ctx.fillRect(drawX - this.width/2, this.y - this.height/2, this.width, this.height);
        
        // HP 바
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - 20, this.y - 30, 40, 5);
        ctx.fillStyle = this.hp > 500 ? 'green' : (this.hp > 200 ? 'yellow' : 'red');
        ctx.fillRect(this.x - 20, this.y - 30, (this.hp / this.maxHp) * 40, 5);
    }
};