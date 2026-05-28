/**
 * items.js - 게임 내 아이템과 관련된 로직과 관련 설정을 담당합니다.
 * AGENTS.md의 '4.2. 아이템 (Item)' 섹션을 기반으로 구현됩니다.
 */
window.Items = {
    // 아이템 정의
    MULTI_SHOT: {
        id: 'multiShot',
        name: '멀티샷',
        type: 'item',
        maxLevel: 3,
        level: 0, // 현재 아이템 레벨
        chances: [0.20, 0.30, 0.40], // Lv1, Lv2, Lv3 발동 확률
        damages: [0.20, 0.25, 0.30], // Lv1, Lv2, Lv3 추가 공 데미지 비율
        description: function(targetLevel) {
            if (targetLevel === 0) return "적 타격 시 확률적으로 추가 공을 발사합니다.";
            const currentChance = this.chances[targetLevel - 1] * 100;
            const currentDamage = this.damages[targetLevel - 1] * 100;
            return `적 타격 시 확률 ${currentChance}%로 현재 공 위치에서 랜덤 방향으로 추가 공 2개를 발사합니다. (추가 공 데미지: ${currentDamage}%)`;
        },
        apply: function() {
            if (this.level < this.maxLevel) {
                this.level++;
                // 멀티샷 아이템 적용 로직 (예: 공 충돌 시 확률 발동)
            }
        },
        currentLevel: function() {
            return this.level;
        }
    },

    EXPLOSIVE_SHELL: {
        id: 'explosiveShell',
        name: '폭발탄',
        type: 'item',
        maxLevel: 3,
        level: 0, // 현재 아이템 레벨
        chances: [0.20, 0.30, 0.40],
        damages: [0.50, 0.75, 1.00],
        description: function(targetLevel) {
            if (targetLevel === 0) return "적 타격 시 확률적으로 주변 적에게 스플래쉬 데미지를 입힙니다.";
            const currentChance = this.chances[targetLevel - 1] * 100;
            const currentDamage = this.damages[targetLevel - 1] * 100;
            return `적 타격 시 확률 ${currentChance}%로 해당 적을 중심으로 7x7 영역 내 다른 적들에게 스플래쉬 데미지 ${currentDamage}%를 입힙니다.`;
        },
        apply: function() {
            if (this.level < this.maxLevel) {
                this.level++;
                // 폭발탄 아이템 적용 로직
            }
        },
        currentLevel: function() {
            return this.level;
        }
    },

    LASER_SPLITTER: {
        id: 'laserSplitter',
        name: '레이저',
        type: 'item',
        maxLevel: 3,
        level: 0, // 현재 아이템 레벨
        chances: [0.20, 0.30, 0.40],
        damages: [0.20, 0.25, 0.30],
        description: function(targetLevel) {
            if (targetLevel === 0) return "적 타격 시 확률적으로 동일 Y 좌표의 모든 적에게 데미지를 줍니다.";
            const currentChance = this.chances[targetLevel - 1] * 100;
            const currentDamage = this.damages[targetLevel - 1] * 100;
            return `적 타격 시 확률 ${currentChance}%로 타격된 적의 중앙 Y 좌표와 동일한 선상에 있는 모든 적에게 데미지 ${currentDamage}%를 줍니다.`;
        },
        apply: function() {
            if (this.level < this.maxLevel) {
                this.level++;
                // 레이저 아이템 적용 로직
            }
        },
        currentLevel: function() {
            return this.level;
        }
    },

    DOPPELGANGER: {
        id: 'doppelganger',
        name: '도플갱어',
        type: 'item',
        maxLevel: 3,
        level: 0, // 현재 아이템 레벨
        chances: [1.00, 1.00, 1.00], // 항상 발동
        damages: [0.50, 0.75, 1.00],
        description: function(targetLevel) {
            if (targetLevel === 0) return "공이 두 줄로 발사됩니다.";
            const currentDamage = this.damages[targetLevel - 1] * 100;
            return `공이 두 줄로 발사되며, 각각의 공은 데미지 ${currentDamage}%를 가집니다.`;
        },
        apply: function() {
            if (this.level < this.maxLevel) {
                this.level++;
                // 도플갱어 아이템 적용 로직 (공 개수 2배)
                // Game.BALL_COUNT *= 2; // 또는 다른 방식으로 처리
            }
        },
        currentLevel: function() {
            return this.level;
        }
    },

    /**
     * 모든 아이템 정의를 배열로 반환합니다.
     * @returns {Array<Object>} 모든 아이템 객체의 배열
     */
    getAllItems: function() {
        return [this.MULTI_SHOT, this.EXPLOSIVE_SHELL, this.LASER_SPLITTER, this.DOPPELGANGER];
    },

    /**
     * Items 모듈을 초기화합니다.
     * 모든 아이템의 레벨을 0으로 초기화합니다.
     */
    init: function() {
        this.getAllItems().forEach(item => {
            item.level = 0;
        });
    }
};