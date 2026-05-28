/**
 * skills.js - 게임 내 스킬과 관련된 로직과 관련 설정을 담당합니다.
 * AGENTS.md의 '4.1. 스킬 (Skill)' 섹션을 기반으로 구현됩니다.
 */
window.Skills = {
    // 스킬 정의
    ATTACK_POWER_UP: {
        id: 'attackPowerUp',
        name: '공격력 증가',
        type: 'skill',
        maxLevel: 999,
        level: 0, // 현재 스킬 레벨
        /**
         * 현재 레벨에 따른 설명을 반환합니다.
         * @param {number} targetLevel - 설명을 보고자 하는 스킬 레벨
         * @returns {string} 스킬 설명
         */
        description: function(targetLevel) {
            return `공의 기본 데미지가 +${targetLevel} 증가합니다.`;
        },
        /**
         * 스킬을 적용하고 레벨을 증가시킵니다.
         */
        apply: function() {
            if (this.level < this.maxLevel) {
                this.level++;
                Game.BALL_DAMAGE++; // Game 객체의 BALL_DAMAGE를 직접 증가
                // Game.updateHUD(); // HUD 업데이트 필요 시 호출 (추후 구현)
            }
        },
        /**
         * 현재 스킬 레벨을 반환합니다.
         * @returns {number} 현재 스킬 레벨
         */
        currentLevel: function() {
            return this.level;
        }
    },

    BALL_COUNT_UP: {
        id: 'ballCountUp',
        name: '공 추가',
        type: 'skill',
        maxLevel: 999,
        level: 0, // 현재 스킬 레벨
        description: function(targetLevel) {
            return `한 턴에 발사할 수 있는 공의 개수가 +${targetLevel} 증가합니다.`;
        },
        apply: function() {
            if (this.level < this.maxLevel) {
                this.level++;
                Game.BALL_COUNT++; // Game 객체의 BALL_COUNT를 직접 증가
                // Game.updateHUD(); // HUD 업데이트 필요 시 호출 (추후 구현)
            }
        },
        currentLevel: function() {
            return this.level;
        }
    },

    /**
     * 모든 스킬 정의를 배열로 반환합니다.
     * @returns {Array<Object>} 모든 스킬 객체의 배열
     */
    getAllSkills: function() {
        return [this.ATTACK_POWER_UP, this.BALL_COUNT_UP];
    },

    /**
     * Skills 모듈을 초기화합니다.
     * 모든 스킬의 레벨을 0으로 초기화합니다.
     */
    init: function() {
        this.getAllSkills().forEach(skill => {
            skill.level = 0;
        });
    }
};