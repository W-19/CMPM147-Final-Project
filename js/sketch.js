// This is the main file.

let player = {
	x: 0,
	y: 0,
	size: 30,
	moveSpeed: 10
};
let biomeColors = {
	red: [1.0, 0.0, 0.0],
	orange: [1.0, 0.6, 0.0],
	green: [0.0, 1.0, 0.0],
	blue: [0.0, 0.0, 1.0]
}

// The number of pixels along the edge the game will check when generating/culling walls. Theoretically,
// for max efficiency, it should equal player.moveSpeed. For some reason I need to set it higher to avoid all errors.
const WALL_CHECK_DIST = 20;
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
let playerVelocity;

let sc; // a temp variable for whenever a function needs to get a wall's screen coords
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

	generateWallsInRect(0, 0, width, height);
}

function draw(){
	clear();

	// And of course we have to...
	processPlayerMovement();

	//drawBackground(40);
	drawWalls();

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
	text("x: " + player.x + "\ny: " + player.y, 40, 40);
	text("walls in scene: " + walls.length, width-200, 40);
}

function drawBackground(unitSize){ // Draws a background using unitSize*unitSize squares
	for(let y = 0; y < height; y += unitSize){
		for(let x = 0; x < width; x += unitSize){
			//noiseSeed(terrainNoiseSeed);
			biomeColor = getBiome(x, y);
			if(biomeColor == biomeColors.red){
				terrainNoiseVal = noise((x+player.x)*2.5*TERRAIN_NOISE_SCALE, (y+player.y)*2.5*TERRAIN_NOISE_SCALE);
			}
			else if(biomeColor == biomeColors.orange){
				terrainNoiseVal = noise((x+player.x)*TERRAIN_NOISE_SCALE*4, (y+player.y)/8*TERRAIN_NOISE_SCALE*4);
			}
			else if(biomeColor == biomeColors.green){
				terrainNoiseVal = noise((x+player.x)*TERRAIN_NOISE_SCALE, (y+player.y)*TERRAIN_NOISE_SCALE);
			}
			else if(biomeColor == biomeColors.blue){
				terrainNoiseVal = 1.0-noise((x+player.x)*TERRAIN_NOISE_SCALE/2, (y+player.y)*TERRAIN_NOISE_SCALE/2);
			}

			fill(terrainNoiseVal*255*biomeColor[0], terrainNoiseVal*255*biomeColor[1], terrainNoiseVal*255*biomeColor[2]);
			rect(x, y, unitSize, unitSize);
		}
	}
}

function drawWalls(){
	if(playerVelocity[0] < 0) generateWallsInRect(0, 0, WALL_CHECK_DIST, height); // left
	else if(playerVelocity[0] > 0)generateWallsInRect(width-WALL_CHECK_DIST, 0, width, height); // right

	if(playerVelocity[1] < 0) generateWallsInRect(0, 0, width, WALL_CHECK_DIST); // top
	else if(playerVelocity[1] > 0) generateWallsInRect(0, height-WALL_CHECK_DIST, width, height); // bottom

	fill(Wall.color[0], Wall.color[1], Wall.color[2]);
	var wallsToGo = walls.length;
	while(wallsToGo--){
		if(walls[wallsToGo].onScreen() == false){ // cull the wall if it's offscreen
			//console.log("culled wall at " + walls[wallsToGo].x + "," + walls[wallsToGo].y + "(sc " + walls[wallsToGo].screenCoords() + ") because it was offscreen");
			walls.splice(wallsToGo, 1);
		}
		else{ // otherwise, draw it
			walls[wallsToGo].draw();
		}
	}
}

function generateWallsInRect(x1, y1, x2, y2){
	for(let y = y1-player.y%Wall.size; y < y2+player.y%Wall.size; y += Wall.size){
		for(let x = x1-player.x%Wall.size; x < x2+player.x%Wall.size; x += Wall.size){

			//noiseSeed(terrainNoiseSeed);
			biomeColor = getBiome(x, y);
			if(biomeColor == biomeColors.red){
				terrainNoiseVal = noise((x+player.x)*2.5*TERRAIN_NOISE_SCALE, (y+player.y)*2.5*TERRAIN_NOISE_SCALE);
			}
			else if(biomeColor == biomeColors.orange){
				terrainNoiseVal = noise((x+player.x)*TERRAIN_NOISE_SCALE*4, (y+player.y)/8*TERRAIN_NOISE_SCALE*4);
			}
			else if(biomeColor == biomeColors.green){
				terrainNoiseVal = noise((x+player.x)*TERRAIN_NOISE_SCALE, (y+player.y)*TERRAIN_NOISE_SCALE);
			}
			else if(biomeColor == biomeColors.blue){
				terrainNoiseVal = 1.0-noise((x+player.x)*TERRAIN_NOISE_SCALE/2, (y+player.y)*TERRAIN_NOISE_SCALE/2);
			}

			if((biomeColor == biomeColors.blue && terrainNoiseVal < 0.45) || terrainNoiseVal < 0.25){
				attemptToSpawnWall(x, y);
			}
		}
	}
}

function attemptToSpawnWall(x, y){ // x and y are in screen coordinates
	for(wall of walls){
		sc = wall.screenCoords();
		if(Math.abs(x-sc[0]) < Wall.size && Math.abs(y-sc[1]) < Wall.size){
		//if(x+player.x == sc[0] && y+player.y == sc[1]){
			return false;
		}
	}
	walls.push(new Wall(x+player.x, y+player.y));
}

function getBiome(x, y){ // x and y are in screen coordinates
	//noiseSeed(biomeNoiseSeed);
	biomeNoiseVal = noise((x+player.x)*BIOME_NOISE_SCALE, (y+player.y)*BIOME_NOISE_SCALE);
	if(biomeNoiseVal < 0.27) return biomeColors.red; // red biome
	else if(biomeNoiseVal < 0.37) return biomeColors.orange; // orange biome
	else if(biomeNoiseVal < 0.5) return biomeColors.green; // green biome
	else return biomeColors.blue; // blue biome
}

function processPlayerMovement(){
	playerVelocity = [0, 0];

	if(keyIsDown(LEFT_ARROW)) playerVelocity[0] -= player.moveSpeed;
	if(keyIsDown(RIGHT_ARROW)) playerVelocity[0] += player.moveSpeed;

	if(keyIsDown(UP_ARROW)) playerVelocity[1] -= player.moveSpeed;
	if(keyIsDown(DOWN_ARROW)) playerVelocity[1] += player.moveSpeed;

	if(playerVelocity[0] != 0 && playerVelocity[1] != 0){
		playerVelocity[0] = Math.floor(playerVelocity[0]*SQRT_2_OVER_2);
		playerVelocity[1] = Math.floor(playerVelocity[1]*SQRT_2_OVER_2);
	}

	player.x += playerVelocity[0];
	player.y += playerVelocity[1];
}
