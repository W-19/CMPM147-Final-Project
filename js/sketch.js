// This is the main file.

let player = {
	pos: new Point(0, 0),
	size: 30,
	moveSpeed: 10,
	velocity: new Point(0, 0),
	blocked: {
		up: false,
		right: false,
		down: false,
		left: false
	}
};
let biomeColors = {
	red: [255, 0, 0],
	orange: [255, 153, 0],
	green: [0, 255, 0],
	blue: [0, 0, 255]
}

// The number of pixels along the edge the game will check when generating/culling walls. Theoretically,
// for max efficiency, it should equal player.moveSpeed. For some reason I need to set it higher to avoid all errors.
const WALL_CHECK_DIST = 20;
const COLLISION_CHECK_DIST = (player.size/2)+player.moveSpeed-1;
const SQRT_2_OVER_2 = Math.sqrt(2)/2;
let widthPlusWallSize;
let heightPlusWallSize;

//let biomeNoiseSeed = Math.floor(1000000000*(Math.random()-0.5));
const BIOME_NOISE_SCALE = 0.0004;
let biomeNoiseVal;
//let terrainNoiseSeed = Math.floor(1000000000*(Math.random()-0.5));
const TERRAIN_NOISE_SCALE = 0.007;
let terrainNoiseVal;

let biomeColor;

let sc; // a temp variable for whenever a function needs to get a wall's screen coords
let pt; // a temp variable for all other point-related uses
let wall; // a temp variable for whenever a function iterates through the walls array (defined below)

let walls = [];

let showGrid = false; // a debug variable

function setup(){
	createCanvas(800, 600);
	noiseDetail(8, 0.35);
	noStroke();
	textSize(20);
	textAlign(LEFT);
	widthPlusWallSize = width+Wall.size;
	heightPlusWallSize = height+Wall.size;

	generateWallsInRect(new Point(0, 0), new Point(width, height));
}

function draw(){
	player.blocked = {
		top: false,
		right: false,
		bottom: false,
		left: false
	};

	//drawBackground(20);
	let currentBiome = getBiome(player.pos);
	background(currentBiome[0]*0.4, currentBiome[1]*0.4, currentBiome[2]*0.4);
	drawWalls();

	// And of course we have to...
	processPlayerMovement();

	// Draw the player
	fill(0, 180, 0);
	ellipse(width/2, height/2, player.size, player.size);

	// Show the grid if it's enabled. It gets messed up if you move diagonally.
	if(showGrid){
		stroke(220);
		for(let x = Wall.size/2; x < width; x += Wall.size){
			line(x, 0, x, height);
		}
		for(let y = Wall.size/2; y < height; y += Wall.size){
			line(0, y, width, y);
		}
	}

	// Debug text
	fill(255);
	text("x: " + player.pos.x + "\ny: " + player.pos.y, 40, 40);
	text("walls in scene: " + walls.length, width-200, 40);
}

// Coordinate conversion functions
function screen2World_2Args(x, y){
	return new Point(x+player.pos.x-width/2, y+player.pos.y-height/2);
}
function screen2World_1Arg(p){
	return screen2World_2Args(p.x, p.y);
}

function world2Screen_2Args(x, y){
	return new Point(x-player.pos.x+width/2, y-player.pos.y+height/2);
}
function world2Screen_1Arg(p){
	return world2Screen_2Args(p.x, p.y);
}

function drawBackground(unitSize){ // Draws a background using unitSize*unitSize squares
	for(let y = 0; y < height; y += unitSize){
		for(let x = 0; x < width; x += unitSize){
			//noiseSeed(terrainNoiseSeed);

			pt = screen2World_2Args(x, y);
			biomeColor = getBiome(pt);
			if(biomeColor == biomeColors.red){
				terrainNoiseVal = noise(pt.x*2.5*TERRAIN_NOISE_SCALE, pt.y*2.5*TERRAIN_NOISE_SCALE);
			}
			else if(biomeColor == biomeColors.orange){
				terrainNoiseVal = noise(pt.x*TERRAIN_NOISE_SCALE*4, pt.y/8*TERRAIN_NOISE_SCALE*4);
			}
			else if(biomeColor == biomeColors.green){
				terrainNoiseVal = noise(pt.x*TERRAIN_NOISE_SCALE, pt.y*TERRAIN_NOISE_SCALE);
			}
			else if(biomeColor == biomeColors.blue){
				terrainNoiseVal = 1.0-noise(pt.x*TERRAIN_NOISE_SCALE/2, pt.y*TERRAIN_NOISE_SCALE/2);
			}

			fill(terrainNoiseVal*biomeColor[0], terrainNoiseVal*biomeColor[1], terrainNoiseVal*biomeColor[2]);
			rect(x-unitSize/2, y-unitSize/2, unitSize, unitSize);
		}
	}
}

function drawWalls(){
	// Generate new walls
	if(player.velocity.x < 0) generateWallsInRect(new Point(0, 0), new Point(WALL_CHECK_DIST, height)); // left
	else if(player.velocity.x > 0)generateWallsInRect(new Point(width-WALL_CHECK_DIST, 0), new Point(width, height)); // right

	if(player.velocity.y < 0) generateWallsInRect(new Point(0, 0), new Point(width, WALL_CHECK_DIST)); // top
	else if(player.velocity.y > 0) generateWallsInRect(new Point(0, height-WALL_CHECK_DIST), new Point(width, height)); // bottom

	// For each wall, cull it if it's off-screen or draw it otherwise
	// If I ever choose to forgo the contact color then it would be most efficient to set the fill color here
	var wallsToGo = walls.length;
	while(wallsToGo--){
		if(walls[wallsToGo].onScreen() == false){
			//console.log("culled wall at screen coords " + world2Screen_1Arg(walls[wallsToGo].pos) + " because it was offscreen");
			walls.splice(wallsToGo, 1);
		}
		else{ // otherwise, draw it
			walls[wallsToGo].drawAndCheckCollision();
		}
	}
}

function generateWallsInRect(p1, p2){ // paramaters are in SCREEN coordinates
	for(let y = p1.y-player.pos.y%Wall.size; y < p2.y+player.pos.y%Wall.size; y += Wall.size){
		for(let x = p1.x-player.pos.x%Wall.size; x < p2.x+player.pos.x%Wall.size; x += Wall.size){

			//noiseSeed(terrainNoiseSeed);
			pt = screen2World_2Args(x, y);
			if(Math.abs(pt.x) < 100 && Math.abs(pt.y) < 100) continue; // don't draw walls near the player's spawn point
			biomeColor = getBiome(pt);
			if(biomeColor == biomeColors.red){
				terrainNoiseVal = noise(pt.x*2.5*TERRAIN_NOISE_SCALE, pt.y*2.5*TERRAIN_NOISE_SCALE);
			}
			else if(biomeColor == biomeColors.orange){
				terrainNoiseVal = noise(pt.x*TERRAIN_NOISE_SCALE*4, pt.y/8*TERRAIN_NOISE_SCALE*4);
			}
			else if(biomeColor == biomeColors.green){
				terrainNoiseVal = noise(pt.x*TERRAIN_NOISE_SCALE, pt.y*TERRAIN_NOISE_SCALE);
			}
			else if(biomeColor == biomeColors.blue){
				terrainNoiseVal = 1.0-noise(pt.x*TERRAIN_NOISE_SCALE/2, pt.y*TERRAIN_NOISE_SCALE/2);
			}

			if((biomeColor == biomeColors.blue && terrainNoiseVal < 0.45) || terrainNoiseVal < 0.25){
				attemptToSpawnWall(x, y);
			}
		}
	}
}

function attemptToSpawnWall(x, y){ // x and y are in SCREEN coordinates
	for(wall of walls){
		sc = wall.screenCoords();
		if(Math.abs(x-sc.x) < Wall.size && Math.abs(y-sc.y) < Wall.size){
		//if(x+player.pos.x == sc[0] && y+player.pos.y == sc[1]){
			return false;
		}
	}
	walls.push(new Wall(screen2World_2Args(x, y)));
}

function getBiome(p){ // x and y are in WORLD coordinates
	//noiseSeed(biomeNoiseSeed);
	biomeNoiseVal = noise(p.x*BIOME_NOISE_SCALE, p.y*BIOME_NOISE_SCALE);
	if(biomeNoiseVal < 0.27) return biomeColors.red; // red biome
	else if(biomeNoiseVal < 0.37) return biomeColors.orange; // orange biome
	else if(biomeNoiseVal < 0.5) return biomeColors.green; // green biome
	else return biomeColors.blue; // blue biome
}

function processPlayerMovement(){
	player.velocity.x = 0;
	player.velocity.y = 0;

	if(keyIsDown(LEFT_ARROW) && !player.blocked.left) player.velocity.x -= player.moveSpeed;
	if(keyIsDown(RIGHT_ARROW) && !player.blocked.right) player.velocity.x += player.moveSpeed;

	if(keyIsDown(UP_ARROW) && !player.blocked.up) player.velocity.y -= player.moveSpeed;
	if(keyIsDown(DOWN_ARROW) && !player.blocked.down) player.velocity.y += player.moveSpeed;

	if(player.velocity.x != 0 && player.velocity.y != 0){
		player.velocity.x = Math.floor(player.velocity.x*SQRT_2_OVER_2);
		player.velocity.y = Math.floor(player.velocity.y*SQRT_2_OVER_2);
	}

	player.pos.x += player.velocity.x;
	player.pos.y += player.velocity.y;
}
