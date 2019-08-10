// This is the main file.

let mode = 'game';
let player = {
	x: 0,
	y: 0,
	size: 30,
	moveSpeed: 20
};
let biomeColors = {
	red: [1.0, 0.0, 0.0],
	orange: [1.0, 0.6, 0.0],
	green: [0.0, 1.0, 0.0],
	blue: [0.0, 0.0, 1.0]
}

//let biomeNoiseSeed = Math.floor(1000000000*(Math.random()-0.5));
let biomeNoiseScale = 0.0004;
let biomeNoiseVal = null;
//let terrainNoiseSeed = Math.floor(1000000000*(Math.random()-0.5));
let terrainNoiseScale = 0.007;
let terrainNoiseVal = null;

let biomeColor;
let playerVelocity;

let walls = [];

function setup(){
	createCanvas(800, 600);
	noiseDetail(8, 0.35);
	noStroke();
}

function draw(){
	clear();

	// And of course we have to...
	processPlayerMovement();

	drawBackground(10);
	//drawWalls();

	// Draw the player
	fill(0, 180, 0);
	ellipse(width/2, height/2, player.size, player.size);
}

function drawBackground(unitSize){ // Draws a background using unitSize*unitSize squares
	for(let y = 0; y < height; y += unitSize){
		for(let x = 0; x < width; x += unitSize){
			//noiseSeed(terrainNoiseSeed);
			biomeColor = getBiome(x, y);
			if(biomeColor == biomeColors.red){
				terrainNoiseVal = noise((x+player.x)*2.5*terrainNoiseScale, (y+player.y)*2.5*terrainNoiseScale);
			}
			else if(biomeColor == biomeColors.orange){
				terrainNoiseVal = noise((x+player.x)*terrainNoiseScale*4, (y+player.y)/8*terrainNoiseScale*4);
			}
			else if(biomeColor == biomeColors.green){
				terrainNoiseVal = noise((x+player.x)*terrainNoiseScale, (y+player.y)*terrainNoiseScale);
			}
			else if(biomeColor == biomeColors.blue){
				terrainNoiseVal = 1.0-noise((x+player.x)*terrainNoiseScale/2, (y+player.y)*terrainNoiseScale/2);
			}

			fill(terrainNoiseVal*255*biomeColor[0], terrainNoiseVal*255*biomeColor[1], terrainNoiseVal*255*biomeColor[2]);
			rect(x, y, unitSize, unitSize);
		}
	}
}

function drawWalls(){ // also draws background noise, for now
	if(playerVelocity[0] < 0) generateWallsInRect(0, 20, 20, height); // left
	else if(playerVelocity[0] > 0)generateWallsInRect(width-20, 0, width, height); // right

	if(playerVelocity[1] < 0) generateWallsInRect(0, 0, width, 20); // top
	else if(playerVelocity[1] > 0) generateWallsInRect(0, height-20, width, height); // bottom

	fill(0, 0, 0); // Walls are black
	let wallsToCull = [];
	for(let wallIndex = 0; wallIndex < walls.length; wallIndex++){
		if(!walls[wallIndex].onScreen()) wallsToCull += wallIndex;
		else walls[wallIndex].draw();
	}
	// We do this later so no concurrent-mofification shenanigans happen
	// Test is this is an issue and remove it if not
	let culledSoFar = 0;
	for(let wallIndex of wallsToCull){
		walls.splice(wallIndex - culledSoFar);
		culledSoFar++;
	}
}

function generateWallsInRect(x1, y1, x2, y2){
	for(let y = y1; y < y2; y += 10){
		for(let x = x1; x < x2; x += 10){

			//noiseSeed(terrainNoiseSeed);
			biomeColor = getBiome(x, y);

			terrainNoiseVal = noise(x+player.x, y+player.y);
			if((biomeColor == biomeColors.blue && terrainNoiseVal < 0.45) || terrainNoiseVal < 0.25){
				attemptToSpawnWall(x, y);
			}
		}
	}
}

function attemptToSpawnWall(x, y){ // x and y are in screen coordinates
	for(let wall of walls){
		if(Math.abs(wall.x-(x+player.x)) < 10 && Math.abs(wall.y-(y+player.y))){
			return false;
		}
	}
	walls.push(new Wall(x+player.x, y+player.y));
}

function getBiome(x, y){ // x and y are in screen coordinates
	//noiseSeed(biomeNoiseSeed);
	biomeNoiseVal = noise((x+player.x)*biomeNoiseScale, (y+player.y)*biomeNoiseScale);
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
		playerVelocity[0] *= Math.sqrt(2)/2;
		playerVelocity[1] *= Math.sqrt(2)/2;
	}

	player.x += playerVelocity[0];
	player.y += playerVelocity[1];
}
