// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

// Game variables
let player;
let cursors;
let bullets;
let enemies;
let score = 0;
let scoreText;
let gameOver = false;
let lastEnemySpawn = 0;
let stars;
let wasdKeys;
let gameOverText;
let currentScene;

function preload() {
    // Since we don't have assets, we'll create graphics dynamically
}

function create() {
    currentScene = this;
    
    // Create a starfield background
    stars = this.add.group();
    for (let i = 0; i < 50; i++) {
        const star = this.add.rectangle(
            Phaser.Math.Between(0, 800),
            Phaser.Math.Between(0, 600),
            2,
            2,
            0xffffff
        );
        star.speed = Phaser.Math.FloatBetween(1, 3);
        stars.add(star);
    }

    // Create player
    player = this.add.rectangle(400, 500, 40, 40, 0x00ff00);
    this.physics.add.existing(player);
    player.body.setCollideWorldBounds(true);

    // Create bullets group with pooling
    bullets = this.physics.add.group({
        maxSize: 30,
        runChildUpdate: false
    });

    // Pre-create bullet pool (create 30 bullets upfront, all inactive)
    for (let i = 0; i < 30; i++) {
        const bullet = this.add.rectangle(0, 0, 6, 15, 0xffff00);
        this.physics.add.existing(bullet);
        bullet.body.setEnable(false);
        bullet.setActive(false).setVisible(false);
        bullets.add(bullet);
    }

    // Create enemies group with pooling
    enemies = this.physics.add.group({
        maxSize: 50,
        runChildUpdate: false
    });

    // Pre-create enemy pool (create 50 enemies upfront, all inactive)
    for (let i = 0; i < 50; i++) {
        const enemy = this.add.rectangle(0, 0, 40, 40, 0xff0000);
        this.physics.add.existing(enemy);
        enemy.body.setEnable(false);
        enemy.setActive(false).setVisible(false);
        enemies.add(enemy);
    }

    // Set up controls
    cursors = this.input.keyboard.createCursorKeys();
    wasdKeys = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
        space: Phaser.Input.Keyboard.KeyCodes.SPACE
    });

    // Score text
    scoreText = this.add.text(16, 16, 'Score: 0', {
        fontSize: '32px',
        fill: '#fff'
    });

    // Set up collisions
    this.physics.add.overlap(bullets, enemies, hitEnemy, null, this);
    this.physics.add.overlap(player, enemies, hitPlayer, null, this);

    // Game over text (hidden initially)
    gameOverText = this.add.text(400, 300, 'GAME OVER\nPress R to Restart', {
        fontSize: '48px',
        fill: '#ff0000',
        align: 'center'
    });
    gameOverText.setOrigin(0.5);
    gameOverText.setVisible(false);

    // Restart key
    this.input.keyboard.on('keydown-R', () => {
        if (gameOver) {
            this.scene.restart();
            score = 0;
            gameOver = false;
        }
    });
}

function update(time, delta) {
    if (gameOver) {
        return;
    }

    // Update starfield
    stars.children.entries.forEach(star => {
        star.y += star.speed;
        if (star.y > 600) {
            star.y = 0;
            star.x = Phaser.Math.Between(0, 800);
        }
    });

    // Player movement
    const speed = 300;
    player.body.setVelocity(0);

    if (cursors.left.isDown || wasdKeys.left.isDown) {
        player.body.setVelocityX(-speed);
    } else if (cursors.right.isDown || wasdKeys.right.isDown) {
        player.body.setVelocityX(speed);
    }

    if (cursors.up.isDown || wasdKeys.up.isDown) {
        player.body.setVelocityY(-speed);
    } else if (cursors.down.isDown || wasdKeys.down.isDown) {
        player.body.setVelocityY(speed);
    }

    // Shooting
    if (Phaser.Input.Keyboard.JustDown(cursors.space) || Phaser.Input.Keyboard.JustDown(wasdKeys.space)) {
        shootBullet(this);
    }

    // Spawn enemies
    if (time > lastEnemySpawn + 1000) {
        spawnEnemy(this);
        lastEnemySpawn = time;
    }

    // Update bullets (deactivate when off-screen instead of destroying)
    bullets.children.entries.forEach(bullet => {
        if (bullet.active && bullet.y < 0) {
            bullet.body.setEnable(false);
            bullet.setActive(false).setVisible(false);
        }
    });

    // Update enemies (deactivate when off-screen instead of destroying)
    enemies.children.entries.forEach(enemy => {
        if (enemy.active && enemy.y > 600) {
            enemy.body.setEnable(false);
            enemy.setActive(false).setVisible(false);
        }
    });
}

function shootBullet(scene) {
    // Get a dead bullet from the pool, or create a new one if pool is exhausted
    let bullet = bullets.getFirstDead();
    
    if (!bullet) {
        // Pool exhausted, create a new one (shouldn't happen often with pre-created pool)
        bullet = scene.add.rectangle(0, 0, 6, 15, 0xffff00);
        scene.physics.add.existing(bullet);
        bullets.add(bullet);
    }
    
    // Revive and configure the bullet
    bullet.setActive(true).setVisible(true);
    bullet.x = player.x;
    bullet.y = player.y - 20;
    bullet.body.setEnable(true);
    bullet.body.setVelocityY(-400);
}

function spawnEnemy(scene) {
    // Get a dead enemy from the pool, or create a new one if pool is exhausted
    let enemy = enemies.getFirstDead();
    
    if (!enemy) {
        // Pool exhausted, create a new one (shouldn't happen often with pre-created pool)
        enemy = scene.add.rectangle(0, 0, 40, 40, 0xff0000);
        scene.physics.add.existing(enemy);
        enemies.add(enemy);
    }
    
    // Revive and configure the enemy
    const x = Phaser.Math.Between(20, 780);
    enemy.setActive(true).setVisible(true);
    enemy.x = x;
    enemy.y = 0;
    enemy.body.setEnable(true);
    enemy.body.setVelocityY(Phaser.Math.Between(100, 200));
}

function hitEnemy(bullet, enemy) {
    // Return objects to pool instead of destroying them
    bullet.body.setEnable(false);
    bullet.setActive(false).setVisible(false);
    
    enemy.body.setEnable(false);
    enemy.setActive(false).setVisible(false);
    
    score += 10;
    scoreText.setText('Score: ' + score);
}

function hitPlayer(player, enemy) {
    gameOver = true;
    gameOverText.setVisible(true);
    currentScene.physics.pause();
}
