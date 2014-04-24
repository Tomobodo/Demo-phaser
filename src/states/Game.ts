module Demo {
    export class GameState extends Phaser.State {

        player: Player;
        planets: Array<Planet>;
        gameWorld: Phaser.Group;
        level: Level;
        arrows: Array<CheckPointArrow>;

        nbcheckPoint: number;
        nbcheckPointChecked: number;

        worldMinX: number = 1000;
        worldMinY: number = 1000;
        worldMaxX: number = -1000;
        worldMaxY: number = -1000;

        lastCheckpoint: Planet;

        static currentLevel: number;
        static max_lvl: number = 0;

        create() {
            this.add.sprite(0, 0, 'background');

            this.planets = new Array<Planet>();
            this.arrows = new Array<CheckPointArrow>();

            this.nbcheckPoint = 0;
            this.nbcheckPointChecked = 0;

            // world group for camera movement
            this.gameWorld = this.add.group(this, 'gameWorld', true);

            // parse level
            var levelString: string = (String)(this.game.cache.getText("level_" + GameState.currentLevel));
            this.level = JSON.parse(levelString);

            // add player
            this.player = new Player(this.game,
                this.planets,
                this.level.gravity,
                this.level.jumpStrength);
            this.gameWorld.add(this.player);

            // add planets
            for (var i in this.level.planets) {
                var planet: Planet = Planet.initFromLvl(this.game, this.level.planets[i]);
                this.planets.push(planet);
                this.gameWorld.add(planet);

                // set first checkpoint
                if (planet.start) {
                    this.player.land(planet);
                    this.lastCheckpoint = planet;
                }

                // add checkpoint
                if (planet.checkPoint) {
                    var arrow: CheckPointArrow = new CheckPointArrow(this.game, planet);
                    this.add.existing(arrow);
                    this.arrows.push(arrow);
                    this.nbcheckPoint++;
                }

                // add beacon
                if (planet.end) {
                    var beacon: Beacon = new Beacon(this.game, planet);
                    this.gameWorld.add(beacon);
                    planet.beacon = beacon;
                }

                if (planet.x < this.worldMinX) this.worldMinX = planet.x - 1000;
                if (planet.y < this.worldMinY) this.worldMinY = planet.y - 1000;
                if (planet.x > this.worldMaxX) this.worldMaxX = planet.x + 1000;
                if (planet.y > this.worldMaxY) this.worldMaxY = planet.y + 1000;
            }

            // text
            var style = { font: '10px Lucida Console', fill: '#ffffff' };
            var text: Phaser.Text = this.add.text(0, 0, 'Space Hop Demo Dev', style);
        }

        update() {
            // Check if player is out of the level
            this.checkBounds();

            // When landing
            if (this.player.state == PlayerState.LANDED)
                this.onLanding();

            // Camera follow
            this.updateCamera();
        }

        onLanding() {
            // Move the camera
            var planet: Planet = this.player.currentPlanet;
            this.gameWorld.x += (planet.cameraX - planet.x - this.gameWorld.x) / 10;
            this.gameWorld.y += (planet.cameraY - planet.y - this.gameWorld.y) / 10;

            // set checkPoint if any
            if (planet.checkPoint) {
                this.lastCheckpoint = planet;
                if(!planet.checked)
                    this.nbcheckPointChecked++;
                planet.checked = true;
            }

            // Check if we reached the end
            if (planet.end && this.nbcheckPointChecked == this.nbcheckPoint) {
                planet.beacon.open();
                planet.cameraX = this.game.width / 2;
                planet.cameraY = this.game.height / 2;
                this.player.canJump = false;
                if (planet.beacon.fullyOpened)
                    this.gotoNextLevel();
            }
        }

        checkBounds() {
            if (this.player.x < this.worldMinX ||
                this.player.x > this.worldMaxX ||
                this.player.y < this.worldMinY ||
                this.player.y > this.worldMaxY) {
                this.player.land(this.lastCheckpoint);
            }
        }

        gotoNextLevel() {
            GameState.currentLevel++;
            if (GameState.currentLevel > GameState.max_lvl)
                GameState.currentLevel = 1;
            this.game.state.restart();
        }

        shutdown() {
            this.gameWorld.destroy(true);

            for (var i in this.arrows)
                this.arrows[i].destroy();
        }

        updateCamera() {
            var globalPlayerX = this.gameWorld.x + this.player.x;
            var globalPlayerY = this.gameWorld.y + this.player.y;

            var cameraPadding: number = 150;
            var followCoef: number = 3;

            var maxCamX = this.game.width - cameraPadding;
            var maxCamY = this.game.height - cameraPadding;
            var minCamX = 0 + cameraPadding;
            var minCamY = 0 + cameraPadding;

            if (this.player.state == PlayerState.FLYING) {
                if (globalPlayerX > maxCamX) this.gameWorld.x -= (globalPlayerX - maxCamX) / followCoef;
                else if (globalPlayerX < minCamX) this.gameWorld.x += (minCamX - globalPlayerX) / followCoef;

                if (globalPlayerY > maxCamY) this.gameWorld.y -= (globalPlayerY - maxCamY) / followCoef;
                else if (globalPlayerY < minCamY) this.gameWorld.y += (minCamY - globalPlayerY) / followCoef;
            }
        }

    }
} 