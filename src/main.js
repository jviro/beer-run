import Phaser from 'phaser';
import './style.css';

const HIGH_SCORE_KEY = 'phaser-runner-high-score';
const ASSETS = {
  playerRun1: 'assets/player-run-1.png',
  playerRun2: 'assets/player-run-2.png',
  playerRun3: 'assets/player-run-3.png',
  playerRun4: 'assets/player-run-4.png',
  playerRun5: 'assets/player-run-5.png',
  playerRun6: 'assets/player-run-6.png',
  playerJump: 'assets/player-jump.png',
  playerDrinkRun: 'assets/player-drink-run.png?v=2',
  playerDrinkJump: 'assets/player-drink-jump.png?v=2',
  playerDead: 'assets/player-dead.png',
  beerCan: 'assets/beer-can.png',
  liquorBottle: 'assets/liquor-bottle.png',
  policeCar: 'assets/police-car.png',
  barBackground: 'assets/bar-background.png',
  startCharacter: 'assets/start-character.png',
  gameOverCharacter: 'assets/game-over-character.png?v=2',
  streetSegment1: 'assets/street-segment-1.png',
  streetSegment2: 'assets/street-segment-2.png',
  streetSegment3: 'assets/street-segment-3.png',
  streetSegment4: 'assets/street-segment-4.png',
  groundTile: 'assets/ground-tile.png',
  heart: 'assets/heart.png',
};
const AUDIO = {
  beerPickup: { path: 'assets/audio/beer_pickup.wav', volume: 0.45 },
  liquorHit: { path: 'assets/audio/liquor_hit.wav', volume: 0.65 },
  policeCarPassing: { path: 'assets/audio/police_car_passing.wav', volume: 0.55 },
  jump: { path: 'assets/audio/jump.wav', volume: 0.35 },
  landing: { path: 'assets/audio/landing.wav', volume: 0.25 },
  healthGain: { path: 'assets/audio/health_gain.wav', volume: 0.55 },
  heartBounceFullHealth: { path: 'assets/audio/heart_bounce_full_health.wav', volume: 0.45 },
  buttonClick: { path: 'assets/audio/button_click.wav', volume: 0.35 },
  gameOver: { path: 'assets/audio/game_over.wav', volume: 0.65 },
};
const MUSIC = {
  titleTheme: { path: 'assets/audio/pubrock_title_theme.wav', volume: 0.28, loop: true },
  gameplayLoop: { path: 'assets/audio/pubrock_gameplay_loop.wav', volume: 0.25, loop: true },
  gameOverSting: { path: 'assets/audio/pubrock_game_over_sting.wav', volume: 0.55, loop: false },
};
const STREET_SEGMENT_KEYS = [
  'streetSegment1',
  'streetSegment2',
  'streetSegment3',
  'streetSegment4',
];

function getHighScore() {
  const storedScore = Number.parseInt(window.localStorage.getItem(HIGH_SCORE_KEY) ?? '0', 10);

  return Number.isNaN(storedScore) ? 0 : storedScore;
}

function saveHighScore(score) {
  const highScore = Math.max(getHighScore(), score);

  window.localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
  return highScore;
}

function playSound(scene, key) {
  const sound = AUDIO[key];

  if (!sound) {
    return;
  }

  scene.sound.play(key, { volume: sound.volume });
}

function playImmediateSound(scene, key) {
  const sound = AUDIO[key];
  const context = scene.sound.context;
  const audioBuffer = scene.game.cache.audio.get(key);

  if (!sound || !context || !audioBuffer || typeof context.createBufferSource !== 'function') {
    playSound(scene, key);
    return;
  }

  const source = context.createBufferSource();
  const gain = context.createGain();

  source.buffer = audioBuffer;
  gain.gain.setValueAtTime(sound.volume, context.currentTime);
  source.connect(gain);
  gain.connect(context.destination);
  source.start(context.currentTime);
}

function stopMusic(scene, key) {
  const music = scene.sound.get(key);

  if (music?.isPlaying) {
    music.stop();
  }
}

function playMusic(scene, key) {
  const music = MUSIC[key];

  if (!music) {
    return;
  }

  Object.keys(MUSIC).forEach((musicKey) => {
    if (musicKey !== key) {
      stopMusic(scene, musicKey);
    }
  });

  const existingMusic = scene.sound.get(key);

  if (existingMusic?.isPlaying) {
    return;
  }

  scene.sound.play(key, {
    volume: music.volume,
    loop: music.loop,
  });
}

class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  preload() {
    Object.entries(ASSETS).forEach(([key, path]) => {
      this.load.image(key, path);
    });
    Object.entries(AUDIO).forEach(([key, { path }]) => {
      this.load.audio(key, path);
    });
    Object.entries(MUSIC).forEach(([key, { path }]) => {
      this.load.audio(key, path);
    });
  }

  create() {
    this.cameras.main.setBackgroundColor('#ffffff');
    playMusic(this, 'titleTheme');
    if (this.sound.locked) {
      this.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
        if (this.scene.isActive()) {
          playMusic(this, 'titleTheme');
        }
      });
    }
    this.createMenu();
    this.scale.on('resize', this.layoutMenu, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.layoutMenu, this);
    });
  }

  createMenu() {
    this.menuBackground = this.add.image(0, 0, 'barBackground')
      .setOrigin(0.5, 1)
      .setAlpha(0)
      .setDepth(0);
    this.menuOverlay = this.add.rectangle(0, 0, 1, 1, 0xffffff, 1)
      .setOrigin(0.5)
      .setDepth(1);
    this.menuGroup = this.add.container(0, 0).setDepth(2);
    this.menuCharacter = this.add.image(0, 0, 'startCharacter')
      .setOrigin(0.5, 1);
    this.title = this.add.text(0, 0, 'Beer Before Liquor: The Michael Redding Story', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '54px',
      color: '#0f172a',
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 5,
      align: 'center',
    }).setOrigin(0.5);

    this.subtitle = this.add.text(0, 0, 'Collect beer. Avoid liquor.', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#b45309',
      stroke: '#ffffff',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.startButton = this.createButton('Start', () => {
      stopMusic(this, 'titleTheme');
      this.scene.start('GameScene');
    });

    this.highScoreButton = this.createButton('High Score', () => {
      this.showHighScore();
    });

    this.menuGroup.add([this.menuCharacter, this.title, this.subtitle, this.startButton, this.highScoreButton]);
    this.layoutMenu();
  }

  createButton(label, callback) {
    const button = this.add.container(0, 0);
    const background = this.add.rectangle(0, 0, 240, 62, 0x6ee7b7, 1);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      color: '#0f172a',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    background.setStrokeStyle(3, 0xf8fafc);
    background.setInteractive({ useHandCursor: true });
    text.setInteractive({ useHandCursor: true });
    const handleClick = () => {
      playSound(this, 'buttonClick');
      callback();
    };

    background.on('pointerup', handleClick);
    text.on('pointerup', handleClick);
    button.add([background, text]);

    return button;
  }

  layoutMenu() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;
    const isCompact = this.scale.width < 780 || this.scale.height < 700;

    const backgroundScale = Math.max(
      this.scale.width / this.menuBackground.width,
      this.scale.height / this.menuBackground.height,
    );
    this.menuBackground
      .setScale(backgroundScale)
      .setPosition(centerX, centerY);
    this.menuOverlay
      .setSize(this.scale.width, this.scale.height)
      .setPosition(centerX, centerY);
    this.title.setStyle({
      fontSize: isCompact ? '34px' : '44px',
      wordWrap: { width: Math.min(this.scale.width - 40, isCompact ? 520 : 760), useAdvancedWrap: true },
    });
    this.subtitle.setStyle({
      fontSize: isCompact ? '22px' : '24px',
      wordWrap: { width: Math.min(this.scale.width - 40, 620), useAdvancedWrap: true },
    });

    const buttonHeight = 62;
    const buttonGap = isCompact ? 12 : 14;
    const subtitleGap = isCompact ? 12 : 14;
    const titleGap = isCompact ? 46 : 52;
    const characterGap = isCompact ? 16 : 22;
    const titleHeight = this.title.height;
    const subtitleHeight = isCompact ? 28 : 32;
    const characterMaxHeight = Math.min(this.scale.height * (isCompact ? 0.35 : 0.42), isCompact ? 250 : 310);
    const characterMaxWidth = this.scale.width * (isCompact ? 0.52 : 0.36);
    const characterScale = Math.min(
      characterMaxWidth / this.menuCharacter.width,
      characterMaxHeight / this.menuCharacter.height,
    );
    const characterHeight = this.menuCharacter.height * characterScale;
    const stackHeight = characterHeight + characterGap + titleHeight + subtitleGap
      + subtitleHeight + titleGap + buttonHeight + buttonGap + buttonHeight;
    const stackTop = Math.max(18, centerY - stackHeight / 2);
    const characterBottom = stackTop + characterHeight;
    const titleY = characterBottom + characterGap + titleHeight / 2;
    const subtitleY = titleY + titleHeight / 2 + subtitleGap + subtitleHeight / 2;
    const startY = subtitleY + subtitleHeight / 2 + titleGap + buttonHeight / 2;
    const highScoreY = startY + buttonHeight / 2 + buttonGap + buttonHeight / 2;

    this.menuCharacter
      .setScale(characterScale)
      .setAlpha(0.96)
      .setPosition(centerX, characterBottom);
    this.title.setPosition(centerX, titleY);
    this.subtitle.setPosition(centerX, subtitleY);
    this.startButton.setPosition(centerX, startY);
    this.highScoreButton.setPosition(centerX, highScoreY);

    if (this.highScoreGroup) {
      this.highScoreGroup.setPosition(centerX, centerY);
      this.highScoreBackdrop.setSize(this.scale.width, this.scale.height);
    }
  }

  showHighScore() {
    if (this.highScoreGroup) {
      this.highScoreGroup.destroy(true);
    }

    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;
    const highScore = getHighScore();

    this.highScoreGroup = this.add.container(centerX, centerY).setDepth(20);
    this.highScoreBackdrop = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x020617, 0.72);
    const panel = this.add.rectangle(0, 0, 410, 250, 0x182235, 0.98);
    const title = this.add.text(0, -72, 'High Score', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '40px',
      color: '#f8fafc',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    const scoreText = this.add.text(0, -12, String(highScore), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '42px',
      color: '#fbbf24',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    const backButton = this.createButton('Back', () => {
      this.highScoreGroup.destroy(true);
      this.highScoreGroup = null;
      this.highScoreBackdrop = null;
    });

    panel.setStrokeStyle(4, 0x6ee7b7);
    backButton.setPosition(0, 78);
    this.highScoreGroup.add([this.highScoreBackdrop, panel, title, scoreText, backButton]);
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#182235');
    playMusic(this, 'gameplayLoop');

    this.baseRunnerSpeed = 320;
    this.maxRunnerSpeed = 520;
    this.runnerSpeed = this.baseRunnerSpeed;
    this.gravity = 1500;
    this.jumpVelocity = -620;
    this.maxJumps = 2;
    this.jumpCount = 0;
    this.lastJumpInputTime = -Infinity;
    this.jumpInputCooldown = 140;
    this.groundHeight = 96;
    this.playerStartX = 170;
    this.groundY = this.scale.height - this.groundHeight;
    this.score = 0;
    this.health = 3;
    this.beerStreak = 0;
    this.beerStreakBonusActive = false;
    this.nextBeerSpawn = 0;
    this.nextBottleSpawn = 1.6;
    this.elapsedSeconds = 0;
    this.difficultyProgress = 0;
    this.lastBottleHitTime = -Infinity;
    this.damageCooldown = 1.2;
    this.beerCollectPoseTime = 0;
    this.obstaclesSincePoliceCar = 0;
    this.policeCarPityThreshold = Phaser.Math.Between(7, 10);
    this.gameOver = false;

    this.createWorld();
    this.createPlayer();
    this.createHud();
    this.createInput();

    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupScene, this);
  }

  update() {
    if (this.gameOver) {
      return;
    }

    const deltaSeconds = this.game.loop.delta / 1000;

    this.updateDifficulty(deltaSeconds);
    this.updatePlayer(deltaSeconds);
    this.scrollWorld(deltaSeconds);
    this.updateBeers(deltaSeconds);
    this.updateBottles(deltaSeconds);
    this.checkBeerCollection();
    this.checkBottleCollision();
  }

  createWorld() {
    this.createNightBackdrop();
    this.backgroundTiles = this.add.group();
    this.groundTiles = this.add.group();
    this.ground = this.add.rectangle(
      this.scale.width / 2,
      this.groundY + this.groundHeight / 2,
      this.scale.width,
      this.groundHeight,
      0x26364f,
    );

    this.groundLine = this.add.rectangle(
      this.scale.width / 2,
      this.groundY + 2,
      this.scale.width,
      4,
      0x6ee7b7,
    );

    this.spawnBackground();
    this.spawnGroundTiles();
    this.beers = this.add.group();
    this.bottles = this.add.group();
  }

  createNightBackdrop() {
    this.nightSky = this.add.graphics();
    this.distantBuildings = this.add.group();
    this.stars = this.add.group();

    this.drawNightBackdrop();
  }

  createPlayer() {
    if (!this.anims.exists('player-run')) {
      this.anims.create({
        key: 'player-run',
        frames: [
          { key: 'playerRun1' },
          { key: 'playerRun2' },
          { key: 'playerRun3' },
          { key: 'playerRun4' },
          { key: 'playerRun5' },
          { key: 'playerRun6' },
        ],
        frameRate: 12,
        repeat: -1,
      });
    }

    this.player = this.add.sprite(this.playerStartX, this.groundY, 'playerRun1')
      .setOrigin(0.5, 1)
      .setDisplaySize(98, 160);
    this.player.play('player-run');
    this.playerVelocityY = 0;
  }

  createHud() {
    this.scoreText = this.add.text(24, 24, 'Score: 0', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      color: '#f8fafc',
      stroke: '#182235',
      strokeThickness: 5,
    });
    this.scoreText.setDepth(10);

    this.heartIcons = [];

    for (let index = 0; index < 3; index += 1) {
      const heart = this.add.image(40 + index * 38, 76, 'heart')
        .setDisplaySize(32, 30)
        .setDepth(10);

      this.heartIcons.push(heart);
    }
  }

  createInput() {
    this.input.keyboard?.on('keydown-SPACE', this.jump, this);
    this.input.on('pointerdown', this.jump, this);

    this.handleKeyJump = (event) => {
      if (event.code !== 'Space') {
        return;
      }

      event.preventDefault();
      this.jump();
    };

    this.handlePointerJump = (event) => {
      if (this.gameOver) {
        this.tryRestartFromDomEvent(event);
        return;
      }

      event.preventDefault();
      this.jump();
    };

    window.addEventListener('keydown', this.handleKeyJump);
    document.addEventListener('mousedown', this.handlePointerJump);
    document.addEventListener('touchstart', this.handlePointerJump, { passive: false });
    this.game.canvas.addEventListener('pointerdown', this.handlePointerJump);
    this.game.canvas.addEventListener('touchstart', this.handlePointerJump, { passive: false });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.removeInputListeners, this);
  }

  cleanupScene() {
    this.scale.off('resize', this.handleResize, this);
    this.tweens.killTweensOf(this.player);
  }

  removeInputListeners() {
    window.removeEventListener('keydown', this.handleKeyJump);
    document.removeEventListener('mousedown', this.handlePointerJump);
    document.removeEventListener('touchstart', this.handlePointerJump);
    this.game.canvas.removeEventListener('pointerdown', this.handlePointerJump);
    this.game.canvas.removeEventListener('touchstart', this.handlePointerJump);
  }

  jump() {
    const inputTime = this.time.now;

    if (this.gameOver || inputTime - this.lastJumpInputTime < this.jumpInputCooldown) {
      return;
    }

    if (this.isPlayerGrounded()) {
      this.jumpCount = 0;
    }

    if (this.jumpCount >= this.maxJumps) {
      return;
    }

    this.lastJumpInputTime = inputTime;
    this.playerVelocityY = this.jumpVelocity;
    this.jumpCount += 1;
    playSound(this, 'jump');
  }

  updatePlayer(deltaSeconds) {
    const wasAirborne = !this.isPlayerGrounded();

    this.player.x = this.playerStartX;
    this.playerVelocityY += this.gravity * deltaSeconds;
    this.player.y += this.playerVelocityY * deltaSeconds;

    if (this.playerVelocityY >= 0 && this.player.y >= this.groundY) {
      this.player.y = this.groundY;
      this.playerVelocityY = 0;
      this.jumpCount = 0;

      if (wasAirborne) {
        playSound(this, 'landing');
      }
    }

    if (this.beerCollectPoseTime > 0) {
      this.beerCollectPoseTime = Math.max(0, this.beerCollectPoseTime - deltaSeconds);
      this.player.stop();

      if (this.isPlayerGrounded()) {
        this.player.setTexture('playerDrinkRun');
        this.player.setDisplaySize(126, 160);
      } else {
        this.player.setTexture('playerDrinkJump');
        this.player.setDisplaySize(156, 160);
      }

      return;
    }

    if (this.isPlayerGrounded()) {
      if (this.player.anims.currentAnim?.key !== 'player-run' || !this.player.anims.isPlaying) {
        this.player.play('player-run');
      }

      this.player.setDisplaySize(98, 160);
    } else if (this.player.texture.key !== 'playerJump') {
      this.player.stop();
      this.player.setTexture('playerJump');
      this.player.setDisplaySize(126, 156);
    }
  }

  isPlayerGrounded() {
    return this.player.y >= this.groundY - 2;
  }

  updateDifficulty(deltaSeconds) {
    this.elapsedSeconds += deltaSeconds;
    this.difficultyProgress = Phaser.Math.Clamp(this.elapsedSeconds / 120, 0, 1);
    this.runnerSpeed = Phaser.Math.Linear(this.baseRunnerSpeed, this.maxRunnerSpeed, this.difficultyProgress);
  }

  scrollWorld(deltaSeconds) {
    const distance = this.runnerSpeed * deltaSeconds;

    this.backgroundTiles.children.each((tile) => {
      tile.x -= distance * 0.52;

      if (tile.x + tile.displayWidth < 0) {
        this.recycleBackgroundTile(tile);
      }
    });

    this.groundTiles.children.each((tile) => {
      tile.x -= distance;

      if (tile.x + tile.displayWidth < 0) {
        this.recycleScrollingTile(tile, this.groundTiles, -28, this.groundHeight + 2);
      }
    });
  }

  updateBeers(deltaSeconds) {
    this.nextBeerSpawn -= deltaSeconds;

    if (this.nextBeerSpawn <= 0) {
      if (this.beers.getLength() < 5) {
        this.spawnBeer();
      }

      this.scheduleNextBeer();
    }

    const distance = this.runnerSpeed * deltaSeconds;

    this.beers.children.each((beer) => {
      beer.x -= distance;

      if (beer.x < -80) {
        this.beerStreak = 0;
        beer.destroy();
      }
    });
  }

  updateBottles(deltaSeconds) {
    this.nextBottleSpawn -= deltaSeconds;

    if (this.nextBottleSpawn <= 0) {
      if (this.shouldSpawnBottle()) {
        this.spawnBottle();
      }

      this.scheduleNextBottle();
    }

    const distance = this.runnerSpeed * deltaSeconds;

    this.bottles.children.each((bottle) => {
      bottle.x -= distance * (bottle.getData('speedMultiplier') ?? 1);

      if (bottle.x < -180) {
        bottle.destroy();
      }
    });
  }

  spawnBeer() {
    const x = this.scale.width + Phaser.Math.Between(120, 420);
    const lane = this.getBeerLane();
    const y = this.getBeerSpawnY(lane);
    const beer = this.createBeer(x, y);

    beer.setData('requiresJump', lane !== 'low');
    beer.setData('lane', lane);
    this.beers.add(beer);
  }

  getBeerLane() {
    const roll = Math.random();

    if (roll < 0.45) {
      return 'low';
    }

    if (roll < 0.75) {
      return 'jump';
    }

    return 'doubleJump';
  }

  getBeerSpawnY(lane) {
    const laneOffsets = {
      low: [Phaser.Math.Between(84, 132), Phaser.Math.Between(142, 184)],
      jump: [Phaser.Math.Between(230, 292), Phaser.Math.Between(306, 356)],
      doubleJump: [Phaser.Math.Between(360, 398), Phaser.Math.Between(386, 420)],
    };
    const offset = Phaser.Math.RND.pick(laneOffsets[lane] ?? laneOffsets.low);

    return Phaser.Math.Clamp(this.groundY - offset, 72, this.groundY - 72);
  }

  scheduleNextBeer() {
    const minDelay = Phaser.Math.Linear(1.1, 0.65, this.difficultyProgress);
    const maxDelay = Phaser.Math.Linear(2.3, 1.45, this.difficultyProgress);

    this.nextBeerSpawn = Phaser.Math.FloatBetween(minDelay, maxDelay);
  }

  createBeer(x, y) {
    const beer = this.add.image(x, y, 'beerCan')
      .setDisplaySize(54, 80);

    beer.setData('collectible', true);

    return beer;
  }

  spawnBottle() {
    const x = this.scale.width + Phaser.Math.Between(220, 560);
    const y = this.groundY;
    const policeCarChance = Phaser.Math.Linear(0.12, 0.18, this.difficultyProgress);
    const shouldSpawnPoliceCar = Math.random() < policeCarChance
      || this.obstaclesSincePoliceCar >= this.policeCarPityThreshold;
    const bottle = shouldSpawnPoliceCar
      ? this.createPoliceCar(x, y)
      : this.createBottle(x, y);

    if (shouldSpawnPoliceCar) {
      this.obstaclesSincePoliceCar = 0;
      this.policeCarPityThreshold = Phaser.Math.Between(7, 10);
    } else {
      this.obstaclesSincePoliceCar += 1;
    }

    this.bottles.add(bottle);
    this.maybeSpawnBeerNearBottle(bottle);
  }

  maybeSpawnBeerNearBottle(bottle) {
    if (this.beers.getLength() >= 5 || Math.random() > 0.42) {
      return;
    }

    const beerBeforeBottle = Math.random() < 0.72;
    const xOffset = beerBeforeBottle
      ? -Phaser.Math.Between(118, 168)
      : Phaser.Math.Between(118, 176);
    const lane = Math.random() < 0.55
      ? Phaser.Math.RND.pick(['jump', 'doubleJump'])
      : 'low';
    const y = this.getBeerSpawnY(lane);
    const beer = this.createBeer(bottle.x + xOffset, y);

    beer.setData('requiresJump', lane !== 'low');
    beer.setData('lane', lane);
    beer.setData('nearBottle', true);
    this.beers.add(beer);
  }

  shouldSpawnBottle() {
    if (this.elapsedSeconds < 3 || this.bottles.getLength() >= 4) {
      return false;
    }

    const bottleChance = Phaser.Math.Linear(0.5, 0.82, this.difficultyProgress);

    return Math.random() < bottleChance;
  }

  scheduleNextBottle() {
    const minDelay = Phaser.Math.Linear(1.55, 1.05, this.difficultyProgress);
    const maxDelay = Phaser.Math.Linear(2.75, 1.9, this.difficultyProgress);

    this.nextBottleSpawn = Phaser.Math.FloatBetween(minDelay, maxDelay);
  }

  createBottle(x, y) {
    const bottle = this.add.image(x, y, 'liquorBottle')
      .setOrigin(0.5, 1)
      .setDisplaySize(64, 102);

    bottle.setData('obstacle', true);
    bottle.setData('speedMultiplier', 1);

    return bottle;
  }

  createPoliceCar(x, y) {
    const policeCar = this.add.image(x, y, 'policeCar')
      .setOrigin(0.5, 1)
      .setDisplaySize(180, 71);

    policeCar.setData('obstacle', true);
    policeCar.setData('speedMultiplier', Phaser.Math.FloatBetween(2.25, 2.75));
    policeCar.setData('isPoliceCar', true);
    playSound(this, 'policeCarPassing');

    return policeCar;
  }

  checkBeerCollection() {
    const playerBounds = this.player.getBounds();

    this.beers.children.each((beer) => {
      if (!beer.active || !Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, beer.getBounds())) {
        return;
      }

      this.collectBeer(beer);
    });
  }

  collectBeer(beer) {
    const completedBeerStreak = !this.beerStreakBonusActive && (this.beerStreak + 1) % 10 === 0;

    beer.destroy();
    this.score += 1;
    this.scoreText.setText(`Score: ${this.score}`);
    this.beerStreak += 1;
    if (completedBeerStreak) {
      playImmediateSound(this, 'healthGain');
      this.showBeerStreakBonus();
    } else {
      playSound(this, 'beerPickup');
    }
    this.showBeerCollectPose();
  }

  updateBeerStreak() {
    this.beerStreak += 1;

    if (this.beerStreak % 10 !== 0 || this.beerStreakBonusActive) {
      return;
    }

    this.showBeerStreakBonus();
  }

  showBeerStreakBonus() {
    const canHeal = this.health < 3;

    this.beerStreakBonusActive = true;
    this.showBeerStreakMessage(canHeal);
    this.createFoamBurst();
    this.animateStreakHeart(canHeal);
  }

  showBeerStreakMessage(canHeal) {
    const message = canHeal
      ? '10 BEER STREAK!\n❤️ +1'
      : '10 BEER STREAK!\nHEALTH FULL';
    const text = this.add.text(this.player.x, this.player.y - 190, message, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '26px',
      color: '#f8fafc',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#182235',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(30);

    this.tweens.add({
      targets: text,
      y: text.y - 50,
      alpha: 0,
      duration: 2400,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  createFoamBurst() {
    for (let index = 0; index < 12; index += 1) {
      const bubble = this.add.circle(
        this.player.x + Phaser.Math.Between(-28, 28),
        this.player.y - Phaser.Math.Between(74, 126),
        Phaser.Math.FloatBetween(2, 5),
        0xffffff,
        Phaser.Math.FloatBetween(0.62, 0.92),
      ).setDepth(28);

      this.tweens.add({
        targets: bubble,
        x: bubble.x + Phaser.Math.Between(-34, 34),
        y: bubble.y - Phaser.Math.Between(22, 58),
        alpha: 0,
        scale: Phaser.Math.FloatBetween(1.35, 1.9),
        duration: Phaser.Math.Between(1260, 2160),
        ease: 'Cubic.easeOut',
        onComplete: () => bubble.destroy(),
      });
    }
  }

  animateStreakHeart(canHeal) {
    const targetIndex = canHeal ? this.health : 2;
    const targetHeart = this.heartIcons[targetIndex] ?? this.heartIcons[this.heartIcons.length - 1];
    const startX = this.player.x;
    const startY = this.player.y - 118;
    const endX = targetHeart.x;
    const endY = targetHeart.y;
    const controlY = Math.min(startY, endY) - 90;
    const flyingHeart = this.add.image(startX, startY, 'heart')
      .setDisplaySize(28, 26)
      .setDepth(31);
    const flight = { progress: 0 };

    this.tweens.add({
      targets: flight,
      progress: 1,
      duration: 1950,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        const t = flight.progress;
        flyingHeart.x = Phaser.Math.Linear(startX, endX, t);
        flyingHeart.y = ((1 - t) * (1 - t) * startY) + (2 * (1 - t) * t * controlY) + (t * t * endY);
      },
      onComplete: () => {
        if (canHeal) {
          this.awardBeerStreakHealth(targetIndex);
          flyingHeart.destroy();
          return;
        }

        this.bounceFullHealthHeart(flyingHeart);
      },
    });
  }

  awardBeerStreakHealth(heartIndex) {
    this.health = Math.min(3, this.health + 1);
    this.updateHealthDisplay();
    this.pulseHudHeart(heartIndex);
    this.beerStreak = 0;
    this.beerStreakBonusActive = false;
  }

  pulseHudHeart(heartIndex) {
    const heart = this.heartIcons[heartIndex];

    if (!heart) {
      return;
    }

    this.tweens.add({
      targets: heart,
      scaleX: heart.scaleX * 1.2,
      scaleY: heart.scaleY * 1.2,
      duration: 330,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
  }

  bounceFullHealthHeart(flyingHeart) {
    const baseY = flyingHeart.y;

    playSound(this, 'heartBounceFullHealth');
    this.tweens.add({
      targets: flyingHeart,
      y: baseY - 14,
      duration: 360,
      yoyo: true,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: flyingHeart,
          y: baseY + 26,
          alpha: 0,
          duration: 690,
          ease: 'Sine.easeIn',
          onComplete: () => {
            flyingHeart.destroy();
            this.beerStreak = 0;
            this.beerStreakBonusActive = false;
          },
        });
      },
    });
  }

  showBeerCollectPose() {
    this.beerCollectPoseTime = 0.45;

    if (this.isPlayerGrounded()) {
      this.player.stop();
      this.player.setTexture('playerDrinkRun');
      this.player.setDisplaySize(126, 160);
      return;
    }

    this.player.stop();
    this.player.setTexture('playerDrinkJump');
    this.player.setDisplaySize(156, 160);
  }

  checkBottleCollision() {
    const playerBounds = this.getPlayerBottleHitbox();

    this.bottles.children.each((bottle) => {
      if (!bottle.active || !Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, this.getBottleHitbox(bottle))) {
        return;
      }

      this.hitBottle(bottle);
    });
  }

  getPlayerBottleHitbox() {
    const bounds = this.player.getBounds();

    return new Phaser.Geom.Rectangle(
      bounds.x + bounds.width * 0.24,
      bounds.y + bounds.height * 0.16,
      bounds.width * 0.52,
      bounds.height * 0.62,
    );
  }

  getBottleHitbox(bottle) {
    const bounds = bottle.getBounds();

    return new Phaser.Geom.Rectangle(
      bounds.x + bounds.width * 0.26,
      bounds.y + bounds.height * 0.32,
      bounds.width * 0.48,
      bounds.height * 0.62,
    );
  }

  hitBottle(bottle) {
    bottle.destroy();

    if (this.elapsedSeconds - this.lastBottleHitTime < this.damageCooldown) {
      return;
    }

    this.lastBottleHitTime = this.elapsedSeconds;
    this.health = Math.max(0, this.health - 1);
    playSound(this, 'liquorHit');
    this.updateHealthDisplay();
    this.flashPlayer();

    if (this.health === 0) {
      this.endGame();
    }
  }

  flashPlayer() {
    this.tweens.killTweensOf(this.player);
    this.player.setAlpha(1);

    this.tweens.add({
      targets: this.player,
      alpha: 0.25,
      duration: 90,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.player.setAlpha(1);
      },
    });
  }

  endGame() {
    if (this.gameOver) {
      return;
    }

    this.gameOver = true;
    this.highScore = saveHighScore(this.score);
    this.playerVelocityY = 0;
    playMusic(this, 'gameOverSting');
    playSound(this, 'gameOver');
    this.tweens.killTweensOf(this.player);
    this.player.setAlpha(1);
    this.player.stop();
    this.player
      .setTexture('playerDead')
      .setOrigin(0.5, 1)
      .setDisplaySize(260, 79)
      .setPosition(this.playerStartX + 34, this.groundY);
    this.showGameOver();
  }

  showGameOver() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;
    const overlayWidth = Math.min(this.scale.width - 48, 470);
    const overlayHeight = Math.min(this.scale.height - 48, 570);
    const imageMaxWidth = overlayWidth * 0.78;
    const imageMaxHeight = overlayHeight * 0.44;

    this.gameOverGroup = this.add.container(centerX, centerY).setDepth(100);

    this.gameOverBackdrop = this.add.rectangle(
      0,
      0,
      this.scale.width,
      this.scale.height,
      0x020617,
      0.68,
    );
    const panel = this.add.rectangle(0, 0, overlayWidth, overlayHeight, 0x182235, 0.96);
    const gameOverCharacter = this.add.image(0, -overlayHeight / 2 + 24, 'gameOverCharacter')
      .setOrigin(0.5, 0);
    const characterScale = Math.min(
      imageMaxWidth / gameOverCharacter.width,
      imageMaxHeight / gameOverCharacter.height,
    );
    const titleY = Math.min(78, overlayHeight / 2 - 190);
    const finalScoreY = titleY + 58;
    const highScoreY = finalScoreY + 40;
    const restartY = highScoreY + 62;
    gameOverCharacter.setScale(characterScale);

    const title = this.add.text(0, titleY, 'Game Over', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '44px',
      color: '#f8fafc',
      fontStyle: 'bold',
    });
    const finalScore = this.add.text(0, finalScoreY, `Final Score: ${this.score}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      color: '#fbbf24',
    });
    const highScoreText = this.add.text(0, highScoreY, `High Score: ${this.highScore}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#f8fafc',
    });
    const restartButton = this.add.rectangle(0, restartY, 190, 58, 0x6ee7b7, 1);
    const restartHitArea = this.add.rectangle(0, restartY, 240, 82, 0xffffff, 0.001);
    const restartText = this.add.text(0, restartY, 'Restart', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '26px',
      color: '#0f172a',
      fontStyle: 'bold',
    });

    panel.setStrokeStyle(4, 0x6ee7b7);
    title.setOrigin(0.5);
    finalScore.setOrigin(0.5);
    highScoreText.setOrigin(0.5);
    restartText.setOrigin(0.5);
    this.restartButtonBounds = new Phaser.Geom.Rectangle(
      centerX - 120,
      centerY + restartY - 41,
      240,
      82,
    );
    restartHitArea.setInteractive({ useHandCursor: true });
    restartHitArea.setData('restartHitArea', true);
    restartButton.setInteractive({ useHandCursor: true });
    restartText.setInteractive({ useHandCursor: true });
    restartHitArea.on('pointerdown', this.restartGame, this);
    restartHitArea.on('pointerup', this.restartGame, this);
    restartButton.on('pointerdown', this.restartGame, this);
    restartButton.on('pointerup', this.restartGame, this);
    restartText.on('pointerdown', this.restartGame, this);
    restartText.on('pointerup', this.restartGame, this);

    this.gameOverGroup.add([
      this.gameOverBackdrop,
      panel,
      gameOverCharacter,
      title,
      finalScore,
      highScoreText,
      restartButton,
      restartText,
      restartHitArea,
    ]);
  }

  tryRestartFromDomEvent(event) {
    if (!this.restartButtonBounds) {
      return;
    }

    const point = this.getCanvasPoint(event);

    if (!point || !Phaser.Geom.Rectangle.Contains(this.restartButtonBounds, point.x, point.y)) {
      return;
    }

    event.preventDefault();
    this.restartGame();
  }

  getCanvasPoint(event) {
    const touch = event.touches?.[0] ?? event.changedTouches?.[0];
    const clientX = touch?.clientX ?? event.clientX;
    const clientY = touch?.clientY ?? event.clientY;

    if (clientX === undefined || clientY === undefined) {
      return null;
    }

    const rect = this.game.canvas.getBoundingClientRect();
    const scaleX = this.scale.width / rect.width;
    const scaleY = this.scale.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  restartGame() {
    playSound(this, 'buttonClick');
    stopMusic(this, 'gameOverSting');
    this.scene.restart();
  }

  updateHealthDisplay() {
    this.heartIcons.forEach((heart, index) => {
      heart.setAlpha(index < this.health ? 1 : 0.22);
    });
  }

  drawNightBackdrop() {
    this.nightSky.clear();
    this.distantBuildings.clear(true, true);
    this.stars.clear(true, true);

    const width = this.scale.width;
    const height = this.scale.height;
    const horizonY = this.groundY - this.getStreetSegmentHeight() + 72;
    const bandHeight = Math.max(height / 5, 1);
    const colors = [0x050816, 0x071125, 0x0b1730, 0x10203d, 0x172a46];

    colors.forEach((color, index) => {
      this.nightSky.fillStyle(color, 1);
      this.nightSky.fillRect(0, index * bandHeight, width, bandHeight + 1);
    });

    this.nightSky.fillStyle(0x07101f, 0.38);
    this.nightSky.fillCircle(width * 0.78, Math.max(90, height * 0.16), 46);

    for (let index = 0; index < 38; index += 1) {
      const star = this.add.circle(
        Phaser.Math.Between(8, width - 8),
        Phaser.Math.Between(18, Math.max(42, horizonY - 120)),
        Phaser.Math.FloatBetween(0.8, 1.9),
        0xf8fafc,
        Phaser.Math.FloatBetween(0.28, 0.82),
      );

      this.stars.add(star);
    }

    for (let x = -40; x < width + 120; x += Phaser.Math.Between(54, 86)) {
      const buildingWidth = Phaser.Math.Between(42, 82);
      const buildingHeight = Phaser.Math.Between(58, 142);
      const building = this.add.rectangle(
        x + buildingWidth / 2,
        horizonY - buildingHeight / 2,
        buildingWidth,
        buildingHeight,
        Phaser.Math.RND.pick([0x12213a, 0x172849, 0x1a2f54]),
        0.74,
      );

      this.distantBuildings.add(building);

      for (let windowY = horizonY - buildingHeight + 14; windowY < horizonY - 12; windowY += 22) {
        for (let windowX = x + 10; windowX < x + buildingWidth - 8; windowX += 18) {
          if (Math.random() > 0.38) {
            const litWindow = this.add.rectangle(windowX, windowY, 5, 8, 0xfbbf24, 0.62);

            this.distantBuildings.add(litWindow);
          }
        }
      }
    }
  }

  spawnBackground() {
    this.backgroundTiles.clear(true, true);

    const displayHeight = this.getStreetSegmentHeight();
    let x = -24;

    while (x < this.scale.width + 260) {
      const tile = this.createStreetSegment(x, displayHeight);

      this.backgroundTiles.add(tile);
      x += tile.displayWidth - 18;
    }
  }

  getStreetSegmentHeight() {
    return Math.min(390, Math.max(260, this.groundY * 0.56));
  }

  getStreetSegmentSize(textureKey, displayHeight = this.getStreetSegmentHeight()) {
    const texture = this.textures.get(textureKey).getSourceImage();

    return {
      height: displayHeight,
      width: (texture.width / texture.height) * displayHeight,
    };
  }

  getRandomStreetSegmentKey(previousKey) {
    const choices = STREET_SEGMENT_KEYS.filter((key) => key !== previousKey);

    return Phaser.Math.RND.pick(choices.length > 0 ? choices : STREET_SEGMENT_KEYS);
  }

  createStreetSegment(x, displayHeight, previousKey) {
    const textureKey = this.getRandomStreetSegmentKey(previousKey);
    const size = this.getStreetSegmentSize(textureKey, displayHeight);
    const tile = this.add.image(x, this.groundY + 18, textureKey)
      .setOrigin(0, 1)
      .setDisplaySize(size.width, size.height);

    tile.setData('segmentKey', textureKey);

    return tile;
  }

  spawnGroundTiles() {
    this.groundTiles.clear(true, true);

    const texture = this.textures.get('groundTile').getSourceImage();
    const displayHeight = this.groundHeight + 18;
    const displayWidth = (texture.width / texture.height) * displayHeight;

    for (let x = 0; x < this.scale.width + displayWidth; x += displayWidth - 28) {
      const tile = this.add.image(x, this.scale.height + 2, 'groundTile')
        .setOrigin(0, 1)
        .setDisplaySize(displayWidth, displayHeight);

      this.groundTiles.add(tile);
    }
  }

  recycleScrollingTile(tile, group, extraGap, yOffset) {
    const furthestX = group
      .getChildren()
      .reduce((max, child) => Math.max(max, child.x + child.displayWidth), this.scale.width);

    tile.x = furthestX + extraGap - 1;
    tile.y = this.groundY + yOffset;
  }

  recycleBackgroundTile(tile) {
    const previousKey = tile.getData('segmentKey');
    const nextKey = this.getRandomStreetSegmentKey(previousKey);
    const size = this.getStreetSegmentSize(nextKey);
    const furthestX = this.backgroundTiles
      .getChildren()
      .reduce((max, child) => Math.max(max, child.x + child.displayWidth), 0);

    tile.setTexture(nextKey);
    tile.setDisplaySize(size.width, size.height);
    tile.setData('segmentKey', nextKey);
    tile.x = Math.max(furthestX - 18, this.scale.width + 24);
    tile.y = this.groundY + 18;
  }

  handleResize(gameSize) {
    this.groundY = gameSize.height - this.groundHeight;

    this.ground.setPosition(gameSize.width / 2, this.groundY + this.groundHeight / 2);
    this.ground.setSize(gameSize.width, this.groundHeight);
    this.groundLine.setPosition(gameSize.width / 2, this.groundY + 2);
    this.groundLine.setSize(gameSize.width, 4);

    this.drawNightBackdrop();
    this.spawnBackground();
    this.spawnGroundTiles();

    if (this.isPlayerGrounded() || this.player.y > this.groundY) {
      this.player.y = this.groundY;
    }

    this.beers.children.each((beer) => {
      beer.y = Phaser.Math.Clamp(beer.y, 72, this.groundY - 72);
    });

    this.bottles.children.each((bottle) => {
      bottle.y = this.groundY;
    });

    if (this.gameOverGroup) {
      this.gameOverGroup.setPosition(gameSize.width / 2, gameSize.height / 2);
      this.gameOverBackdrop.setSize(gameSize.width, gameSize.height);
      const restartHitArea = this.gameOverGroup.list.find((item) => item.getData?.('restartHitArea'));

      if (restartHitArea) {
        this.restartButtonBounds.setPosition(
          gameSize.width / 2 + restartHitArea.x - 120,
          gameSize.height / 2 + restartHitArea.y - 41,
        );
      }
    }
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#182235',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MenuScene, GameScene],
};

new Phaser.Game(config);
