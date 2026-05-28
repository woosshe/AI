/* common.js - 모든 프로젝트 공통 유틸리티 */
window.playSound = function(src) {
    if (!src) return;
    try {
        const audio = new Audio(src);
        audio.volume = 0.5;
        audio.play().catch(e => console.warn("사운드 재생 실패:", src, e));
    } catch (err) {
        console.error("오디오 객체 생성 실패:", err);
    }
};

console.log("Common utilities loaded.");