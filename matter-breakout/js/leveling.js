/**
 * leveling.js - 경험치 및 레벨업 시스템
 */
window.Leveling = {
    level: 1,
    xp: 0,
    xpToNext: 1000,
    pendingUpgrades: 0,

    init() {
        this.updateUI();
    },

    gainXP(amount) {
        this.xp += amount;
        while (this.xp >= this.xpToNext) {
            this.levelUp();
        }
        this.updateUI();
    },

    levelUp() {
        this.level++;
        this.pendingUpgrades++;
        this.xp -= this.xpToNext;
        this.xpToNext = Math.floor(this.xpToNext * 1.3) + 500;
    },

    showModal() {
        Game.isPaused = true;
        const modal = document.getElementById('levelUpModal');
        const container = document.getElementById('upgradeChoices');
        container.innerHTML = '';
        modal.style.display = 'block';

        const allPool = [...Skills.getAllSkills(), ...Items.getAllItems()]
            .filter(u => u.level < u.maxLevel);
        
        // 랜덤 3개 선택
        const choices = [];
        while(choices.length < 3 && allPool.length > 0) {
            const idx = Math.floor(Math.random() * allPool.length);
            choices.push(allPool.splice(idx, 1)[0]);
        }

        choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'upgrade-item';
            btn.innerHTML = `<strong>${choice.name} (Lv.${choice.level + 1})</strong><br><small>${choice.description(choice.level + 1)}</small>`;
            btn.onclick = () => {
                choice.apply();
                this.pendingUpgrades--;
                if (this.pendingUpgrades === 0) {
                    modal.style.display = 'none';
                    Game.isPaused = false;
                    Game.nextTurnStage();
                } else {
                    this.showModal();
                }
            };
            container.appendChild(btn);
        });
    },

    updateUI() {
        const progress = (this.xp / this.xpToNext) * 100;
        document.getElementById('xp-bar').style.width = `${progress}%`;
    }
};