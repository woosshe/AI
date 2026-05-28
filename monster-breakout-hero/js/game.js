// D:/Dev/Workspace/AI/monster-breakout-hero/js/game.js

(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // --- Game Dimensions ---
  const GAME_WIDTH = 812;
  const GAME_HEIGHT = 600;
  // --- End Game Dimensions ---

  // --- Image Loading ---
  const monsterImage = new Image();
  monsterImage.src = 'images/monsters.png';
  let imagesLoaded = false;
  monsterImage.onload = () => {
    imagesLoaded = true;
    console.log("monsters.png loaded successfully.");
  };
  monsterImage.onerror = () => {
    console.error("Failed to load monsters.png. Ensure the file exists in the 'images' folder.");
  };
  // --- End Image Loading ---

  function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    canvas.style.width = GAME_WIDTH + 'px'; // Use logical width for style
    canvas.style.height = GAME_HEIGHT + 'px'; // Use logical height for style
    canvas.width = GAME_WIDTH * ratio; // Set physical width
    canvas.height = GAME_HEIGHT * ratio; // Set physical height
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  resizeCanvas();

  let running = false;
  let gameStarted = false;
  let paused = false;
  let score = 0;
  let turns = 0;
  let characterLevel = 1;
  let cumulativeXP = 0; // 누적 경험치
  let turnStartTime = 0;
  let pendingLevelUps = 0;
  let isCallingBalls = false;
  let lastMidBossTurn = -Infinity; // 중보스 등장 턴 추적

  let ballDamage = 10;
  let ballSpeed = 6;
  let ballCount = 5;
  let enemyHpBonus = 0; // 5턴마다 증가하는 적 HP 보너스

  let characterHP = 1000; // 캐릭터 HP
  const maxCharacterHP = 1000; // 최대 캐릭터 HP

  // 아이템 레벨
  let multiballLevel = 0; // 0: 없음, 1~3: 레벨
  let earthquakeLevel = 0; // 0: 없음, 1~3: 레벨
  let laserBallLevel = 0; // 레이저볼 레벨

  // 공 발사 간격 (전역 변수화)
  const BALL_FIRE_INTERVAL_MS = 150;
  // 타격음 최소 재생 간격
  const MIN_HIT_SOUND_INTERVAL_MS = 50;
  let lastHitSoundTime = 0;

  // 특정 레벨까지 도달하기 위해 필요한 총 누적 경험치 계산
  function getTotalXPForLevel(lv) {
    let total = 0;
    // 초반 레벨업은 너무 느리지 않게, 높아질수록 점진적으로 어려워지도록 조정
    for (let i = 1; i < lv; i++) {
      total += 1000 + (i - 1) * 500 + Math.floor(Math.pow(i - 1, 1.5) * 100);
    }
    return total;
  }

  // 현재 레벨에서 다음 레벨로 가기 위한 목표 누적 경험치
  function getNextLevelTargetXP(lv) {
    return getTotalXPForLevel(lv + 1);
  }

  // 캐릭터
  const character = {
    w: 30, h: 30, x: 0, targetX: 0, y: 0, // x, y, targetX will be set by resetGame
    color: '#6be3ff',
    lerpSpeed: 0.1,
    flashTimer: 0 // 캐릭터 피격 이펙트
  };

  let balls = [];
  let pendingBalls = 0;
  let aiming = false;
  let mousePos = { x: 0, y: 0 }; // Initialized to 0, will be updated by mousemove
  let firstBallLandingX = null;

  const enemyCols = 20; // 한 줄에 20마리 적
  const enemyRows = 15;
  const enemyPadding = 8;
  const enemyOffsetTop = 60;
  const enemyOffsetLeft = 30;
  const enemyHeight = 30; // 1:1 비율을 위해 고정
  let enemyBaseWidth = 30; // 1:1 비율을 위해 고정

  let enemies = [];

  // Sprite map will be defined after enemyBaseWidth is known
  let spriteMap = {};

  const ENEMY_TYPES = [
    { type: 'NORMAL', hp: 100, weight: 100, color: '#cccccc', hitSoundSrc: 'sounds/hit_s.mp3' }, // 밝은 회색
    { type: 'ELITE', hp: 200, weight: 20, color: '#87CEEB', hitSoundSrc: 'sounds/hit_m.mp3' }, // 밝은 파란색
    { type: 'UNIQUE', hp: 300, weight: 7.5, color: '#9370DB', hitSoundSrc: 'sounds/hit_m.mp3' }, // 보라색
    { type: 'MID_BOSS', hp: 500, weight: 2.5, color: '#3CB371', hitSoundSrc: 'sounds/hit_l.mp3' } // 짙은 녹색
  ];

  let damageTexts = []; // New array to hold floating damage numbers
  let laserEffects = []; // 레이저 이펙트 관리를 위한 배열
  let earthquakeEffects = []; // 지진볼 이펙트 관리를 위한 배열

  // 사운드 재생 함수 (새로운 Audio 객체를 생성하여 여러 번 재생 가능하도록 수정)
  function playSound(soundSrc) {
    if (!soundSrc) {
      console.error("Attempted to play a null audio source.");
      return;
    }
    // console.log("Playing sound:", soundSrc); // 디버깅용
    const audio = new Audio(soundSrc);
    audio.volume = 0.5; // 필요에 따라 볼륨 조절
    audio.play().catch(e => console.log(`Audio play failed for ${soundSrc}:`, e)); // 에러 방지
  }

  function initEnemies() {
    enemies = [];
    // enemyBaseWidth는 이제 고정값 30

    // Define sprite map here after enemyBaseWidth is set
    const SPRITE_UNIT_W = enemyBaseWidth; // 30
    const SPRITE_UNIT_H = enemyHeight; // 30

    // This is a guess for the layout of monsters.png based on user's description
    // Assuming sprites are laid out in a grid, each cell being SPRITE_UNIT_W x SPRITE_UNIT_H
    spriteMap = {
      "NORMAL_1x1":   { sx: 0 * SPRITE_UNIT_W, sy: 0 * SPRITE_UNIT_H, sWidth: 1 * SPRITE_UNIT_W, sHeight: 1 * SPRITE_UNIT_H },
      "ELITE_1x2":    { sx: 1 * SPRITE_UNIT_W, sy: 0 * SPRITE_UNIT_H, sWidth: 1 * SPRITE_UNIT_W, sHeight: 2 * SPRITE_UNIT_H }, // Next to NORMAL, 1 unit wide, 2 units tall
      "ELITE_2x1":    { sx: 2 * SPRITE_UNIT_W, sy: 0 * SPRITE_UNIT_H, sWidth: 2 * SPRITE_UNIT_W, sHeight: 1 * SPRITE_UNIT_H }, // Next to ELITE_1x2, 2 units wide, 1 unit tall
      // Assuming next row starts after the tallest sprite in previous row (ELITE_1x2 is 2 units tall)
      "UNIQUE_1x3":   { sx: 0 * SPRITE_UNIT_W, sy: 2 * SPRITE_UNIT_H, sWidth: 1 * SPRITE_UNIT_W, sHeight: 3 * SPRITE_UNIT_H }, // At (0, 2*SPRITE_UNIT_H), 1 unit wide, 3 units tall
      "UNIQUE_3x1":   { sx: 1 * SPRITE_UNIT_W, sy: 2 * SPRITE_UNIT_H, sWidth: 3 * SPRITE_UNIT_W, sHeight: 1 * SPRITE_UNIT_H }, // Next to UNIQUE_1x3, 3 units wide, 1 unit tall
      // Assuming next row starts after the tallest sprite in previous row (UNIQUE_1x3 is 3 units tall, so 2+3=5)
      "MID_BOSS_3x3": { sx: 0 * SPRITE_UNIT_W, sy: 5 * SPRITE_UNIT_H, sWidth: 3 * SPRITE_UNIT_W, sHeight: 3 * SPRITE_UNIT_H }, // At (0, 5*SPRITE_UNIT_H), 3 units wide, 3 units tall
    };

    for (let i = 0; i < 4; i++) addEnemyRow(false);
  }

  function addEnemyRow(withAnimation = true) {
    enemies = enemies.filter(e => e.hp > 0);
    const rowStep = enemyHeight + enemyPadding;

    // 기존 적들 목표 위치 이동
    for (const e of enemies) {
      e.targetY += rowStep;
      if (!withAnimation) e.y = e.targetY; // Use e.targetY for initial placement if no animation
    }

    // 그리드 점유 상태 확인 (e.targetY 기준으로 정확히 계산)
    const grid = Array.from({ length: enemyRows }, () => new Array(enemyCols).fill(false));
    for (const e of enemies) {
      // 적의 논리적인 그리드 시작/끝 셀 계산
      const startCol = Math.floor((e.x - enemyOffsetLeft) / (enemyBaseWidth + enemyPadding));
      const endCol = Math.ceil((e.x + e.w - enemyOffsetLeft) / (enemyBaseWidth + enemyPadding)); // Use actual width for span calculation
      const startRow = Math.floor((e.targetY - enemyOffsetTop) / (enemyHeight + enemyPadding)); // Use e.targetY for grid occupancy
      const endRow = Math.ceil((e.targetY + e.h - enemyOffsetTop) / (enemyHeight + enemyPadding)); // Use actual height for span calculation

      for (let r = startRow; r < endRow; r++) {
        for (let c = startCol; c < endCol; c++) {
          if (r >= 0 && r < enemyRows && c >= 0 && c < enemyCols) {
            grid[r][c] = true;
          }
        }
      }
    }

    const totalWeight = ENEMY_TYPES.reduce((sum, t) => sum + t.weight, 0);
    let currentColumn = 0;

    while (currentColumn < enemyCols) {
      // 현재 칸이 이미 점유되었거나, 40% 확률로 빈 칸을 만들 경우
      if (grid[0][currentColumn] || Math.random() > 0.4) { // 60% 확률로 적 생성 (빈칸 40%)
        currentColumn++;
        continue;
      }

      let rand = Math.random() * totalWeight;
      let selectedType = ENEMY_TYPES[0]; // Default to NORMAL

      // First, determine the type based on weights
      for (const t of ENEMY_TYPES) {
        if (rand < t.weight) {
          selectedType = t;
          break;
        }
        rand -= t.weight;
      }

      // Now, apply Mid-Boss specific rules
      if (selectedType.type === 'MID_BOSS') {
        if (turns < 10 || (turns - lastMidBossTurn) < 2) {
          // Mid-Boss conditions not met, force to NORMAL
          selectedType = ENEMY_TYPES.find(t => t.type === 'NORMAL');
        }
      }


      let wScale = 1, hScale = 1;
      if (selectedType.type === 'ELITE') { // 1x2 or 2x1
        if (Math.random() < 0.5) wScale = 2; else hScale = 2;
      } else if (selectedType.type === 'UNIQUE') { // 1x3 or 3x1
        if (Math.random() < 0.5) wScale = 3; else hScale = 3;
      } else if (selectedType.type === 'MID_BOSS') { // 3x3
        wScale = 3; hScale = 3;
      }

      let canPlace = true;
      // Check horizontal space
      if (currentColumn + wScale > enemyCols) {
        canPlace = false; // 공간 부족
      } else {
        // Check grid occupancy for the new enemy's scaled size
        for (let r = 0; r < hScale; r++) {
          for (let c = 0; c < wScale; c++) {
            // 현재 칸이 그리드 범위 내에 있는지 확인
            if (r >= 0 && r < enemyRows && (currentColumn + c) >= 0 && (currentColumn + c) < enemyCols) {
              if (grid[r][currentColumn + c]) { canPlace = false; break; }
            } else { // 그리드 범위를 벗어나면 배치 불가
              canPlace = false; break;
            }
          }
          if (!canPlace) break;
        }
      }

      if (canPlace) {
        const eWidth = enemyBaseWidth * wScale + enemyPadding * (wScale - 1);
        const eHeight = enemyHeight * hScale + enemyPadding * (hScale - 1);

        // Determine sprite key for spriteMap
        const spriteKey = `${selectedType.type}_${wScale}x${hScale}`;
        const spriteInfo = spriteMap[spriteKey];

        enemies.push({
          x: enemyOffsetLeft + currentColumn * (enemyBaseWidth + enemyPadding),
          y: withAnimation ? enemyOffsetTop - rowStep : enemyOffsetTop,
          targetY: enemyOffsetTop,
          w: eWidth, h: eHeight,
          hp: selectedType.hp + enemyHpBonus, // HP 보너스 적용
          maxHp: selectedType.hp + enemyHpBonus, // Max HP 보너스 적용
          color: selectedType.color, type: selectedType.type,
          flashTimer: 0, // Flash effect timer
          recoilMagnitude: 0, // Recoil effect magnitude
          recoilDecay: 0.8, // How fast recoil fades
          recoilDirectionX: 0, // Direction of recoil
          recoilDirectionY: 0,
          spriteInfo: spriteInfo, // Store sprite info
          hitSoundSrc: selectedType.hitSoundSrc, // 적 등급별 타격음
          wScale: wScale, // Store wScale
          hScale: hScale // Store hScale
        });
        if (selectedType.type === 'MID_BOSS') {
          lastMidBossTurn = turns; // Update last Mid-Boss turn
        }
        currentColumn += wScale;
      } else {
        currentColumn++; // If no space or conditions not met, move to next column
      }
    }
  }

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mousePos.x = e.clientX - rect.left;
    mousePos.y = e.clientY - rect.top;
  });

  canvas.addEventListener('click', () => {
    const isMoving = Math.abs(character.x - character.targetX) > 1;
    const isSelectingSkills = levelUpModal.style.display === 'block';
    if (aiming && pendingBalls > 0 && !paused && !isMoving && !isSelectingSkills) {
      const centerX = character.x + character.w / 2;
      const centerY = character.y;
      const angle = Math.atan2(mousePos.y - centerY, mousePos.x - centerX);
      firePendingBalls(angle);
    }
  });

  const levelUpModal = document.getElementById('levelUpModal');
  const upgradeChoicesContainer = document.getElementById('upgradeChoices'); // 동적 선택지 컨테이너

  // 업그레이드 데이터 정의
  const UPGRADES_DATA = [
    {
      id: 'dmg', name: '공격력 증가', type: 'skill', maxLevel: 99,
      description: (level) => `공격력 +1 (현재: ${ballDamage + 1})`,
      apply: () => { ballDamage += 1; },
      currentLevel: () => ballDamage - 10 // 초기 공격력 10 기준
    },
    {
      id: 'ball', name: '공 추가', type: 'skill', maxLevel: 99,
      description: (level) => `공 +1 (현재: ${ballCount + 1})`,
      apply: () => { ballCount += 1; },
      currentLevel: () => ballCount - 5 // 초기 공 개수 5 기준
    },
    {
      id: 'multiball', name: '멀티볼', type: 'item', maxLevel: 3,
      description: (level) => {
        const chances = [0, 20, 30, 40]; // 20%, 30%, 40%
        const damages = [0, 20, 25, 30]; // 20%, 25%, 30%
        return `적 타격 시 ${chances[level + 1]}% 확률로 추가 공 2개 발사 (데미지 ${damages[level + 1]}%) (Lv.${level + 1})`;
      },
      apply: () => { multiballLevel += 1; },
      currentLevel: () => multiballLevel
    },
    {
      id: 'earthquake', name: '지진볼', type: 'item', maxLevel: 3,
      description: (level) => {
        const chances = [0, 20, 30, 40]; // 20%, 30%, 40%
        const damages = [0, 50, 75, 100]; // 50%, 75%, 100%
        return `적 타격 시 ${chances[level + 1]}% 확률로 7x7 범위 ${damages[level + 1]}% 스플래쉬 데미지 (Lv.${level + 1})`; // 3x3 -> 5x5 -> 7x7
      },
      apply: () => { earthquakeLevel += 1; },
      currentLevel: () => earthquakeLevel
    },
    {
      id: 'laser', name: '레이저볼', type: 'item', maxLevel: 3,
      description: (level) => {
        const chances = [0, 20, 30, 40]; // 20%, 30%, 40%
        const damages = [0, 20, 25, 30]; // 20%, 25%, 30%
        return `적 타격 시 ${chances[level + 1]}% 확률로 가로선상 모든 적에게 ${damages[level + 1]}% 데미지 (Lv.${level + 1})`;
      },
      apply: () => { laserBallLevel += 1; },
      currentLevel: () => laserBallLevel
    }
  ];


  const callBallsBtn = document.getElementById('callBallsBtn');
  const callBtnContainer = document.getElementById('callBallsBtnContainer');

  callBallsBtn.addEventListener('click', () => {
    if (running && !isCallingBalls) {
      isCallingBalls = true;
      callBtnContainer.style.display = 'none';
    }
  });

  function closeLevelUp() {
    pendingLevelUps--;
    updateHUD();
    if (pendingLevelUps <= 0) {
      levelUpModal.style.display = 'none';
      paused = false; // 레벨업 선택이 모두 끝나면 paused 해제
      startAiming();
    } else {
      showLevelUpOptions(); // 남은 레벨업이 있으면 다시 선택지 보여줌
    }
  }

  function showLevelUpOptions() {
    paused = true; // 게임 일시정지
    levelUpModal.style.display = 'block';
    upgradeChoicesContainer.innerHTML = ''; // 기존 선택지 초기화

    const availableUpgrades = UPGRADES_DATA.filter(upgrade => {
      return upgrade.currentLevel() < upgrade.maxLevel;
    });

    // 랜덤으로 3개 (또는 그 이하)의 고유한 선택지 뽑기
    const choices = [];
    const numChoices = Math.min(3, availableUpgrades.length);
    // 중복 방지 로직 개선: ID 기반으로 체크
    // 무한 루프 방지: availableUpgrades가 비어있거나, 모든 업그레이드가 이미 choices에 있다면 루프 탈출
    let attempts = 0;
    const maxAttempts = availableUpgrades.length * 5; // 무한 루프 방지를 위한 최대 시도 횟수
    while (choices.length < numChoices && attempts < maxAttempts) {
      const randomIndex = Math.floor(Math.random() * availableUpgrades.length);
      const chosenUpgrade = availableUpgrades[randomIndex];
      // 이미 선택지에 있는 업그레이드인지 ID로 확인
      if (!choices.some(choice => choice.id === chosenUpgrade.id)) {
        choices.push(chosenUpgrade);
      }
      attempts++;
    }
    // 만약 availableUpgrades가 비어있거나, 모든 업그레이드가 이미 choices에 있다면 루프 탈출
    if (availableUpgrades.length === 0) {
      // 선택할 업그레이드가 없으므로 모달 닫고 게임 재개
      levelUpModal.style.display = 'none';
      paused = false;
      startAiming();
      return;
    }


    choices.forEach(upgrade => {
      const button = document.createElement('button');
      button.classList.add('skill-btn');
      button.textContent = `${upgrade.name} - ${upgrade.description(upgrade.currentLevel())}`;
      button.onclick = () => {
        upgrade.apply();
        closeLevelUp();
      };
      upgradeChoicesContainer.appendChild(button);
    });
  }


  function resetGame() {
    score = 0; turns = 0; characterLevel = 1; cumulativeXP = 0; pendingLevelUps = 0;
    ballDamage = 10; ballSpeed = 6; ballCount = 5; enemyHpBonus = 0; // 보너스 초기화
    characterHP = maxCharacterHP; // 캐릭터 HP 초기화
    multiballLevel = 0;
    earthquakeLevel = 0;
    laserBallLevel = 0; // 레이저볼 초기화
    gameStarted = false; paused = false; isCallingBalls = false;
    lastMidBossTurn = -Infinity; // 중보스 등장 턴 추적 초기화

    character.w = 30; // 캐릭터 너비
    character.h = 30; // 캐릭터 높이 (1:1 비율)
    character.x = (GAME_WIDTH / 2) - (character.w / 2); // 캔버스 중앙에 맞게 조정
    character.targetX = character.x;
    character.y = GAME_HEIGHT - character.h - 10; // 새로운 높이에 맞춰 y 위치 조정
    character.color = '#6be3ff';
    character.flashTimer = 0; // 캐릭터 피격 이펙트 초기화
    firstBallLandingX = null; balls = [];
    initEnemies();
    updateHUD();
    const startBtn = document.getElementById('startBtn');
    startBtn.textContent = '게임 시작';
    startBtn.style.display = 'inline-block';
    callBtnContainer.style.display = 'none';
  }

  function startAiming() {
    turns += 1;
    // 5턴마다 적 HP 보너스 증가
    if (turns > 0 && turns % 5 === 0) {
      enemyHpBonus = (turns / 5) * 50;
    }

    pendingBalls = ballCount;
    firstBallLandingX = null;
    aiming = true;
    running = false;
    isCallingBalls = false;
    character.color = '#6be3ff';
    addEnemyRow(true); // 턴 시작 시 적 내려오는 로직
    updateHUD();
    callBtnContainer.style.display = 'none';
  }

  function firePendingBalls(angle) {
    aiming = false; running = true;
    turnStartTime = 0; // 초기화 (마지막 공 발사 시점에 설정)
    character.color = '#ffd166';

    const baseX = character.x + character.w / 2;
    const baseY = character.y - 10;
    let fired = 0;
    const totalBallsToFire = pendingBalls;

    const firePositions = [{ x: baseX, y: baseY }];

    let currentFirePositionIndex = 0;
    const timer = setInterval(() => {
      if (paused) return;
      if (fired < totalBallsToFire) {
        playSound('sounds/shoot.mp3'); // 공 발사 사운드
        const vx = Math.cos(angle) * ballSpeed;
        const vy = Math.sin(angle) * ballSpeed;

        const firePos = firePositions[currentFirePositionIndex % firePositions.length];
        balls.push({ x: firePos.x, y: firePos.y, r: 6, vx: vx, vy: vy, alive: true, isMultiballGenerated: false, damage: ballDamage, color: '#ff6b6b' }); // 초기 공은 멀티볼 생성 가능

        fired += 1;
        currentFirePositionIndex++; // 다음 분신 위치로 이동
      } else {
        clearInterval(timer);
        pendingBalls = 0;
        turnStartTime = Date.now(); // 마지막 공 발사 시점 기록
      }
    }, BALL_FIRE_INTERVAL_MS); // 전역 변수 사용
  }

  function addXP(amount) {
    cumulativeXP += amount;
    while (cumulativeXP >= getNextLevelTargetXP(characterLevel)) {
      characterLevel++;
      pendingLevelUps++;
    }
    updateHUD();
  }

  function updateHUD() {
    document.getElementById('score').textContent = '점수: ' + score;
    document.getElementById('turns').textContent = '턴: ' + turns;
    document.getElementById('level').textContent = '레벨: ' + characterLevel;

    const targetXP = getNextLevelTargetXP(characterLevel);
    document.getElementById('xp').textContent = `누적 XP: ${Math.floor(cumulativeXP)} / ${targetXP}`;
    document.getElementById('hp').textContent = `HP: ${Math.ceil(characterHP)} / ${maxCharacterHP}`; // HP 표시

    let statsText = `공격력: ${ballDamage} | 공: ${ballCount}`;
    if (multiballLevel > 0) statsText += ` | 멀티볼: Lv.${multiballLevel}`;
    if (earthquakeLevel > 0) statsText += ` | 지진볼: Lv.${earthquakeLevel}`;
    if (laserBallLevel > 0) statsText += ` | 레이저볼: Lv.${laserBallLevel}`;
    document.getElementById('stats').textContent = statsText;

    const modalTitle = levelUpModal.querySelector('h2');
    if (modalTitle && pendingLevelUps > 0) {
      modalTitle.textContent = `LEVEL UP! (남은 선택: ${pendingLevelUps})`;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT); // 캔버스 너비에 맞춰 클리어

    for (const e of enemies) {
      if (e.hp <= 0) continue;

      let drawX = e.x;
      let drawY = e.y;

      // Apply recoil effect
      if (e.recoilMagnitude > 0) {
        drawX += e.recoilDirectionX * e.recoilMagnitude;
        drawY += e.recoilDirectionY * e.recoilMagnitude;
      }

      if (imagesLoaded && e.spriteInfo) {
        // Draw image
        ctx.drawImage(
            monsterImage,
            e.spriteInfo.sx, e.spriteInfo.sy, e.spriteInfo.sWidth, e.spriteInfo.sHeight, // Source rectangle
            drawX, drawY, e.w, e.h // Destination rectangle
        );
      } else {
        // Fallback to drawing colored rectangles if image not loaded or spriteInfo missing
        ctx.fillStyle = e.color;
        roundRect(ctx, drawX, drawY, e.w, e.h, 3, true, false); // 몬스터 모서리 둥글게
      }

      // Apply flash effect over the monster (image or rectangle)
      if (e.flashTimer > 0) {
        ctx.save();
        ctx.globalAlpha = e.flashTimer / 100; // Fade out flash
        ctx.fillStyle = '#ff0000'; // 빨간색 플래시
        roundRect(ctx, drawX, drawY, e.w, e.h, 3, true, false); // 몬스터 모서리 둥글게
        ctx.restore();
      }

      // Mid-Boss border (still drawn as rectangle for simplicity over image)
      if (e.type === 'MID_BOSS') {
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
        roundRect(ctx, drawX, drawY, e.w, e.h, 3, false, true); // 몬스터 모서리 둥글게
      }

      // HP Bar for enemy
      const enemyHpBarWidth = e.w * 0.8; // 적 너비의 80%
      const enemyHpBarHeight = 3;
      const enemyHpBarX = drawX + (e.w - enemyHpBarWidth) / 2;
      const enemyHpBarY = drawY + 2; // 적 블록 상단 내부

      // HP 바 배경
      ctx.fillStyle = '#555555';
      ctx.fillRect(enemyHpBarX, enemyHpBarY, enemyHpBarWidth, enemyHpBarHeight);

      // HP 바 채우기
      const currentEnemyHpWidth = (e.hp / e.maxHp) * enemyHpBarWidth;
      let enemyHpColor = '#00ff00'; // Green
      if (e.hp / e.maxHp < 0.5) enemyHpColor = '#ffff00'; // Yellow
      if (e.hp / e.maxHp < 0.2) enemyHpColor = '#ff0000'; // Red
      ctx.fillStyle = enemyHpColor;
      ctx.fillRect(enemyHpBarX, enemyHpBarY, currentEnemyHpWidth, enemyHpBarHeight);


      // HP text
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center';
      ctx.fillText(Math.ceil(e.hp), drawX + e.w / 2, enemyHpBarY + enemyHpBarHeight + 10); // HP 바 아래로 텍스트 이동
    }

    // Draw Character
    let charDrawX = character.x;
    let charDrawY = character.y;
    if (character.flashTimer > 0) { // 캐릭터 피격 시 플래시 효과
      charDrawX += (Math.random() - 0.5) * 4; // 피격 시 캐릭터도 살짝 흔들림
      charDrawY += (Math.random() - 0.5) * 4;
    }

    ctx.fillStyle = character.color;
    roundRect(ctx, charDrawX, charDrawY, character.w, character.h, 6, true, false);

    // 캐릭터 피격 플래시 효과
    if (character.flashTimer > 0) {
      ctx.save();
      ctx.globalAlpha = character.flashTimer / 100;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(charDrawX, charDrawY, character.w, character.h);
      ctx.restore();
    }

    // 캐릭터 위 HP 바 그리기
    const hpBarWidth = character.w + 10;
    const hpBarHeight = 5;
    const hpBarX = character.x - 5;
    const hpBarY = character.y - hpBarHeight - 15; // HP 텍스트 위

    // HP 바 배경
    ctx.fillStyle = '#555555';
    ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);

    // HP 바 채우기
    const currentHpWidth = (characterHP / maxCharacterHP) * hpBarWidth;
    let hpColor = '#00ff00'; // Green
    if (characterHP / maxCharacterHP < 0.5) hpColor = '#ffff00'; // Yellow
    if (characterHP / maxCharacterHP < 0.2) hpColor = '#ff0000'; // Red
    ctx.fillStyle = hpColor;
    ctx.fillRect(hpBarX, hpBarY, currentHpWidth, hpBarHeight);


    // 캐릭터 위 HP 텍스트 표시
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`HP: ${Math.ceil(characterHP)}`, character.x + character.w / 2, hpBarY - 5);


    for (const b of balls) {
      if (!b.alive) continue;
      ctx.beginPath(); ctx.fillStyle = b.color; // 공 색상 적용
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 레이저 이펙트 그리기
    for (const laser of laserEffects) {
      ctx.save();
      ctx.globalAlpha = laser.alpha;
      ctx.fillStyle = 'rgba(173, 216, 230, 0.8)'; // 흰색에 파란 빛이 도는 밝은 색
      ctx.fillRect(laser.x, laser.y, laser.w, laser.h);
      ctx.restore();
    }

    // 지진볼 이펙트 그리기
    for (const effect of earthquakeEffects) {
      ctx.save();
      ctx.globalAlpha = effect.alpha;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // 50% 투명도를 가진 검은색 원
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const isMoving = Math.abs(character.x - character.targetX) > 1;
    const isSelectingSkills = levelUpModal.style.display === 'block';
    if (aiming && !paused && !isMoving && !isSelectingSkills) {
      const cx = character.x + character.w / 2, cy = character.y;
      ctx.beginPath(); ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
      ctx.moveTo(cx, cy);
      const angle = Math.atan2(mousePos.y - cy, mousePos.x - cx);
      const len = 240;
      ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
      ctx.stroke(); ctx.setLineDash([]);
    }
    const elapsedSinceFire = Date.now() - turnStartTime;
    if (running && turnStartTime !== 0 && elapsedSinceFire > 0 && !paused) {
      let speedText = '';
      if (elapsedSinceFire > 20000) {
        speedText = 'SPEED UP x10';
      } else if (elapsedSinceFire > 10000) {
        speedText = 'SPEED UP x5';
      }
      if (speedText) {
        ctx.fillStyle = 'rgba(255, 107, 107, 0.7)';
        ctx.font = 'bold 18px Arial'; ctx.textAlign = 'right';
        ctx.fillText(speedText, GAME_WIDTH - 30, 40); // 캔버스 너비에 맞춰 조정
      }
      // 강제 회수 버튼 표시
      if (elapsedSinceFire > 5000 && !isCallingBalls) callBtnContainer.style.display = 'block'; // 5초 후부터 표시
      else if (elapsedSinceFire <= 5000 || isCallingBalls) callBtnContainer.style.display = 'none';
    } else {
      callBtnContainer.style.display = 'none';
    }

    // Draw damage texts
    for (const dt of damageTexts) {
      ctx.save();
      ctx.globalAlpha = dt.alpha;
      ctx.fillStyle = '#ffffff'; // White color for damage numbers
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(dt.value, dt.x, dt.y);
      ctx.restore();
    }
  }

  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    if (typeof r === 'undefined') r = 5;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  function update() {
    if (!gameStarted || paused) return;

    // 캐릭터 x 위치 클램핑
    character.x = Math.max(0, Math.min(GAME_WIDTH - character.w, character.x));

    // 적이 캐릭터 라인까지 내려왔는지 체크
    enemies = enemies.filter(e => {
      if (e.hp > 0 && e.y + e.h >= character.y) {
        characterHP -= Math.floor(e.hp / 10); // 적의 현재 HP의 1/10만큼 캐릭터 HP 감소 (정수화)
        character.flashTimer = 100; // 캐릭터 피격 이펙트
        playSound('sounds/hit.wav'); // 타격음 (캐릭터가 맞았을 때)
        updateHUD();
        if (characterHP <= 0) {
          alert('캐릭터 HP가 모두 소진되었습니다! 게임 오버.');
          resetGame();
          return false; // 게임 오버 시 적 제거
        }
        return false; // 적 제거
      }
      return e.hp > 0; // HP가 0보다 크면 유지
    });


    // 모든 적이 사라지면 즉시 새로운 줄 추가 (이건 유지)
    if (enemies.filter(e => e.hp > 0).length === 0) {
      isCallingBalls = true; // 모든 적 제거 시 공 강제 회수
    }

    character.x += (character.targetX - character.x) * character.lerpSpeed;
    if (character.flashTimer > 0) character.flashTimer -= 16; // 캐릭터 플래시 타이머 업데이트

    for (const e of enemies) {
      e.y += (e.targetY - e.y) * 0.1;
      if (e.flashTimer > 0) e.flashTimer -= 16;
      if (e.recoilMagnitude > 0) { // Recoil update
        e.recoilMagnitude *= e.recoilDecay; // 감쇠
        if (e.recoilMagnitude < 0.5) e.recoilMagnitude = 0; // 너무 작아지면 멈춤
      }
    }
    if (!running) return;
    for (const b of balls) {
      if (!b.alive) continue;
      if (isCallingBalls) {
        b.vx = 0; b.vy = 20; b.x += b.vx; b.y += b.vy;
      } else {
        b.x += b.vx; b.y += b.vy;
        if (b.x - b.r <= 0 || b.x + b.r >= GAME_WIDTH) { b.vx *= -1; b.x = b.x <= b.r ? b.r : GAME_WIDTH - b.r; } // 캔버스 너비에 맞춰 조정
        if (b.y - b.r <= 0) { b.vy *= -1; b.y = b.r; }
        for (const e of enemies) {
          if (e.hp <= 0) continue;

          // --- Improved Circle-Rectangle Collision Detection ---
          // 확장된 충돌 영역 계산 (패딩 포함)
          const collisionRectX = e.x - enemyPadding / 2;
          const collisionRectY = e.y - enemyPadding / 2;
          const collisionRectW = e.w + enemyPadding;
          const collisionRectH = e.h + enemyPadding;

          let testX = b.x;
          let testY = b.y;

          // Find the closest point on the *expanded* rectangle to the center of the circle
          if (b.x < collisionRectX) testX = collisionRectX; // left edge
          else if (b.x > collisionRectX + collisionRectW) testX = collisionRectX + collisionRectW; // right edge
          if (b.y < collisionRectY) testY = collisionRectY; // top edge
          else if (b.y > collisionRectY + collisionRectH) testY = collisionRectY + collisionRectH; // bottom edge

          // Calculate the distance from the closest point to the circle's center
          const distX = b.x - testX;
          const distY = b.y - testY;
          const distance = Math.sqrt((distX * distX) + (distY * distY));

          if (distance <= b.r) { // Collision detected with expanded rectangle
            // Determine collision normal
            let normalX = distX;
            let normalY = distY;
            const normalMag = Math.sqrt(normalX * normalX + normalY * normalY);

            if (normalMag === 0) { // Exact center hit, pick a default normal
              normalX = 0; normalY = -1; // Bounce straight up
            } else {
              normalX /= normalMag;
              normalY /= normalMag;
            }

            // Reflect velocity
            const dotProduct = b.vx * normalX + b.vy * normalY;
            b.vx = b.vx - 2 * dotProduct * normalX;
            b.vy = b.vy - 2 * dotProduct * normalY;

            // Prevent ball from sticking (move it out slightly)
            const overlap = b.r - distance;
            b.x += normalX * overlap; // Removed +0.5, use exact overlap
            b.y += normalY * overlap; // Removed +0.5, use exact overlap
            // --- End Improved Circle-Rectangle Collision Detection ---

            // 배속 중이 아닐 때만 타격음 재생
            const now = Date.now();
            if ((now - lastHitSoundTime > MIN_HIT_SOUND_INTERVAL_MS)) { // 최소 간격이 지났을 때만 재생
              playSound(e.hitSoundSrc); // 적 등급별 타격음 재생
              lastHitSoundTime = now;
            }

            e.flashTimer = 100; // 100ms 동안 플래시
            e.recoilMagnitude = 5; // 초기 반동 크기
            e.recoilDirectionX = -normalX; // 공의 반대 방향 (법선 벡터의 반대)
            e.recoilDirectionY = -normalY;
            // 이미 normalX, normalY가 정규화되어 있으므로 다시 정규화할 필요 없음


            let xpGain = 0; // xpGain 초기화
            const currentBallDamage = b.damage || ballDamage; // 공 자체 데미지 사용
            const damageDealt = Math.floor(Math.min(e.hp, currentBallDamage)); // 실제 입힌 데미지 계산 (정수화)
            e.hp -= currentBallDamage;

            // Add damage text
            damageTexts.push({
              value: damageDealt,
              x: e.x + e.w / 2,
              y: e.y + e.h / 2,
              alpha: 1.0,
              vy: -2, // Float upwards
              life: 1000 // Visible for 1 second
            });

            // 멀티볼 효과
            if (multiballLevel > 0 && !b.isMultiballGenerated) { // 멀티볼 생성 공은 다시 멀티볼 생성 안함
              const multiballChance = [0, 0.20, 0.30, 0.40][multiballLevel]; // 20%, 30%, 40%
              if (Math.random() < multiballChance) {
                // 현재 공 위치에서 랜덤 방향으로 2개 추가 공 발사
                for (let i = 0; i < 2; i++) {
                  const randomAngle = Math.random() * Math.PI * 2; // 0 to 360 degrees
                  balls.push({
                    x: b.x, y: b.y, r: 6, // Increased size to 6
                    vx: Math.cos(randomAngle) * ballSpeed,
                    vy: Math.sin(randomAngle) * ballSpeed,
                    alive: true,
                    isMultiballGenerated: true, // 멀티볼로 생성된 공임을 표시
                    damage: Math.floor(ballDamage * [0, 0.20, 0.25, 0.30][multiballLevel]), // 멀티볼 레벨에 따른 데미지
                    color: '#80FFFF80' // 다른 색깔
                  });
                }
                playSound('sounds/multi.mp3'); // 멀티볼 발동 사운드
              }
            }

            // 지진볼 효과
            if (earthquakeLevel > 0 && !b.isMultiballGenerated) { // 멀티볼 생성 공은 지진볼 발동 안함
              const earthquakeChance = [0, 0.20, 0.30, 0.40][earthquakeLevel]; // 20%, 30%, 40%
              if (Math.random() < earthquakeChance) {
                const splashDamagePercentage = [0, 0.50, 0.75, 1.00][earthquakeLevel]; // 레벨에 따른 스플래쉬 데미지 퍼센티지
                const splashDamageAmount = Math.floor(currentBallDamage * splashDamagePercentage); // 스플래쉬 데미지 (정수화)
                const range = 7; // 3x3 -> 5x5 -> 7x7

                // 지진볼 이펙트 추가
                earthquakeEffects.push({
                  x: e.x + e.w / 2, // 타격 받은 적의 중앙 x 좌표
                  y: e.y + e.h / 2, // 타격 받은 적의 중앙 y 좌표
                  radius: range * enemyBaseWidth / 2, // 범위에 맞춰 반지름 설정
                  life: 200, // 200ms 동안 유지
                  alpha: 0.5 // 50% 투명도
                });

                enemies.forEach(otherEnemy => {
                  if (otherEnemy !== e && otherEnemy.hp > 0) {
                    // 거리 계산 (중심점 기준)
                    const dist = Math.sqrt(
                        Math.pow((e.x + e.w / 2) - (otherEnemy.x + otherEnemy.w / 2), 2) +
                        Math.pow((e.y + e.h / 2) - (otherEnemy.y + otherEnemy.h / 2), 2)
                    );
                    // 범위 내에 있는지 체크 (적의 크기를 고려한 대략적인 범위)
                    // 대략적인 범위 계산: (range * enemyBaseWidth / 2) + (otherEnemy.w / 2)
                    const effectiveRange = (range * enemyBaseWidth / 2) + (Math.max(otherEnemy.w, otherEnemy.h) / 2);
                    if (dist < effectiveRange) {
                      const splashDealt = Math.floor(Math.min(otherEnemy.hp, splashDamageAmount)); // 스플래쉬 데미지 (정수화)
                      otherEnemy.hp -= splashDamageAmount;
                      otherEnemy.flashTimer = 100;
                      otherEnemy.recoilMagnitude = 3; // 스플래쉬도 약한 반동
                      otherEnemy.recoilDirectionX = (otherEnemy.x - e.x) / dist || 0;
                      otherEnemy.recoilDirectionY = (otherEnemy.y - e.y) / dist || 0;
                      if (otherEnemy.recoilDirectionX === 0 && otherEnemy.recoilDirectionY === 0) { // 같은 위치일 경우 랜덤 방향
                        otherEnemy.recoilDirectionX = Math.random() * 2 - 1;
                        otherEnemy.recoilDirectionY = Math.random() * 2 - 1;
                      }
                      const recoilDirMagSplash = Math.sqrt(otherEnemy.recoilDirectionX * otherEnemy.recoilDirectionX + otherEnemy.recoilDirectionY * otherEnemy.recoilDirectionY);
                      if (recoilDirMagSplash > 0) {
                        otherEnemy.recoilDirectionX /= recoilDirMagSplash;
                        otherEnemy.recoilDirectionY /= recoilDirMagSplash;
                      }

                      damageTexts.push({
                        value: splashDealt,
                        x: otherEnemy.x + otherEnemy.w / 2,
                        y: otherEnemy.y + otherEnemy.h / 2,
                        alpha: 1.0,
                        vy: -1.5, // Float upwards slightly slower
                        life: 800 // Shorter life
                      });
                      if (otherEnemy.hp <= 0) {
                        xpGain += otherEnemy.maxHp; // 스플래쉬로 죽여도 경험치
                        score += (otherEnemy.type === 'NORMAL' ? 50 : otherEnemy.type === 'ELITE' ? 150 : otherEnemy.type === 'UNIQUE' ? 300 : 1000); // 스플래쉬 점수 절반
                      }
                    }
                  }
                });
                playSound('sounds/quake.mp3'); // 지진볼 발동 사운드
              }
            }

            // 레이저볼 효과
            if (laserBallLevel > 0 && !b.isMultiballGenerated) { // 멀티볼 생성 공은 레이저볼 발동 안함
              const laserChance = [0, 0.20, 0.30, 0.40][laserBallLevel]; // 20%, 30%, 40%
              if (Math.random() < laserChance) {
                const laserDamagePercentage = [0, 0.20, 0.25, 0.30][laserBallLevel]; // 20%, 25%, 30%
                const laserDamage = Math.floor(currentBallDamage * laserDamagePercentage); // 데미지 계산

                // 레이저 이펙트 추가
                laserEffects.push({
                  y: e.y + e.h / 2, // 타격 받은 적의 중앙 y 좌표
                  life: 200, // 200ms 동안 유지
                  alpha: 1.0,
                  x: 0, // 캔버스 왼쪽 끝
                  w: GAME_WIDTH, // 캔버스 전체 너비
                  h: 5 // 레이저 두께
                });


                enemies.forEach(otherEnemy => {
                  // 타격된 적 e와 다른 적이고, HP가 남아있으며, 타격된 적의 중앙 y 좌표와 겹치는 경우
                  if (otherEnemy !== e && otherEnemy.hp > 0 &&
                      (e.y + e.h / 2) >= otherEnemy.y && (e.y + e.h / 2) <= otherEnemy.y + otherEnemy.h) { // 타격된 적의 중앙 y 좌표가 다른 적의 y 범위 내에 있는지 확인

                    const laserDealt = Math.floor(Math.min(otherEnemy.hp, laserDamage));
                    otherEnemy.hp -= laserDamage;
                    otherEnemy.flashTimer = 100;
                    otherEnemy.recoilMagnitude = 3;
                    // 레이저볼은 방향성이 없으므로, 타격된 적 e를 기준으로 다른 적 otherEnemy의 방향으로 반동
                    otherEnemy.recoilDirectionX = (otherEnemy.x - e.x) || (Math.random() * 2 - 1);
                    otherEnemy.recoilDirectionY = (otherEnemy.y - e.y) || (Math.random() * 2 - 1);
                    const recoilDirMagLaser = Math.sqrt(otherEnemy.recoilDirectionX * otherEnemy.recoilDirectionX + otherEnemy.recoilDirectionY * otherEnemy.recoilDirectionY);
                    if (recoilDirMagLaser > 0) {
                      otherEnemy.recoilDirectionX /= recoilDirMagLaser;
                      otherEnemy.recoilDirectionY /= recoilDirMagLaser;
                    }

                    damageTexts.push({
                      value: laserDealt,
                      x: otherEnemy.x + otherEnemy.w / 2,
                      y: otherEnemy.y + otherEnemy.h / 2,
                      alpha: 1.0,
                      vy: -1.5,
                      life: 800
                    });
                    if (otherEnemy.hp <= 0) {
                      xpGain += otherEnemy.maxHp;
                      score += (otherEnemy.type === 'NORMAL' ? 50 : otherEnemy.type === 'ELITE' ? 150 : otherEnemy.type === 'UNIQUE' ? 300 : 1000);
                    }
                  }
                });
                playSound('sounds/laser.mp3'); // 레이저볼 발동 사운드
              }
            }


            xpGain += damageDealt * 2; // 기본 경험치
            if (e.hp <= 0) {
              xpGain += e.maxHp;
              score += (e.type === 'NORMAL' ? 100 : e.type === 'ELITE' ? 300 : e.type === 'UNIQUE' ? 600 : 2000);
            }
            addXP(xpGain);
            break;
          }
        }
      }
      if (b.y - b.r > GAME_HEIGHT) { // 캔버스 높이에 맞춰 조정
        if (firstBallLandingX === null) {
          firstBallLandingX = b.x;
          character.targetX = Math.max(0, Math.min(GAME_WIDTH - character.w, firstBallLandingX - character.w / 2)); // 캔버스 너비에 맞춰 조정
        }
        b.alive = false;
      }
    }
    balls = balls.filter(b => b.alive);
    if (balls.length === 0 && pendingBalls === 0 && !aiming && !paused) {
      running = false;
      if (pendingLevelUps > 0) { showLevelUpOptions(); } // 모달 표시
      else startAiming();
    }
    // 적이 바닥까지 내려왔는지 체크하는 로직은 characterHP 로직으로 대체
    // const lowest = Math.max(...enemies.filter(e => e.hp > 0).map(e => e.targetY + e.h), 0);
    // if (lowest >= character.y - 10) { alert('적이 기지를 점령했습니다! 게임 오버.'); resetGame(); }

    // Update damage texts
    for (let i = damageTexts.length - 1; i >= 0; i--) {
      const dt = damageTexts[i];
      dt.y += dt.vy; // Move upwards
      dt.life -= 16; // Reduce life (assuming 60 FPS)
      dt.alpha = dt.life / 1000; // Fade out linearly over its life

      if (dt.life <= 0) {
        damageTexts.splice(i, 1); // Remove if life is gone
      }
    }

    // Update laser effects
    for (let i = laserEffects.length - 1; i >= 0; i--) {
      const laser = laserEffects[i];
      laser.life -= 16;
      laser.alpha = laser.life / 200; // 200ms 동안 페이드 아웃
      if (laser.life <= 0) {
        laserEffects.splice(i, 1);
      }
    }

    // Update earthquake effects
    for (let i = earthquakeEffects.length - 1; i >= 0; i--) {
      const effect = earthquakeEffects[i];
      effect.life -= 16;
      effect.alpha = effect.life / 200; // 200ms 동안 페이드 아웃
      if (effect.life <= 0) {
        earthquakeEffects.splice(i, 1);
      }
    }
  }

  function loop() {
    update();
    const elapsedSinceFire = Date.now() - turnStartTime;
    if (running && turnStartTime !== 0 && !paused) {
      if (elapsedSinceFire > 20000) for (let i = 0; i < 9; i++) update();
      else if (elapsedSinceFire > 10000) for (let i = 0; i < 4; i++) update();
    }
    draw(); requestAnimationFrame(loop);
  }

  const startBtn = document.getElementById('startBtn');
  startBtn.addEventListener('click', () => {
    if (!gameStarted) { gameStarted = true; startBtn.style.display = 'none'; startAiming(); }
  });

  resetGame();
  loop();
})();