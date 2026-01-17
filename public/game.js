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

function preload() {
    // Since we don't have assets, we'll create graphics dynamically
}

function create() {
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

    // Create bullets group
    bullets = this.physics.add.group({
        defaultKey: 'bullet',
        maxSize: 20
    });

    // Create enemies group
    enemies = this.physics.add.group();

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
    this.gameOverText = this.add.text(400, 300, 'GAME OVER\nPress R to Restart', {
        fontSize: '48px',
        fill: '#ff0000',
        align: 'center'
    });
    this.gameOverText.setOrigin(0.5);
    this.gameOverText.setVisible(false);

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

    // Update bullets
    bullets.children.entries.forEach(bullet => {
        if (bullet.active && bullet.y < 0) {
            bullet.destroy();
        }
    });

    // Update enemies
    enemies.children.entries.forEach(enemy => {
        if (enemy.active && enemy.y > 600) {
            enemy.destroy();
        }
    });
}

function shootBullet(scene) {
    const bullet = scene.add.rectangle(player.x, player.y - 20, 6, 15, 0xffff00);
    scene.physics.add.existing(bullet);
    bullet.body.setVelocityY(-400);
    bullets.add(bullet);
}

function spawnEnemy(scene) {
    const x = Phaser.Math.Between(20, 780);
    const enemy = scene.add.rectangle(x, 0, 40, 40, 0xff0000);
    scene.physics.add.existing(enemy);
    enemy.body.setVelocityY(Phaser.Math.Between(100, 200));
    enemies.add(enemy);
}

function hitEnemy(bullet, enemy) {
    bullet.destroy();
    enemy.destroy();
    score += 10;
    scoreText.setText('Score: ' + score);
}

function hitPlayer(player, enemy) {
    gameOver = true;
    this.gameOverText.setVisible(true);
    this.physics.pause();
}
