// This is the main file.

let mode = 'game';
let player = {
	x: 0,
	y: 0,
	size: 30,
	moveSpeed: 14
};

// let biomeNoiseScale = 0.00007;
// let biomeNoiseVal = null;
let terrainNoiseScale = 0.006;
let terrainNoiseVal = null;

function setup(){
	createCanvas(800, 600);
	noiseDetail(8, 0.25);
	noStroke();
}

function draw(){
	// Draw a noise background to start things off
	for(let y = 0; y < height/10; y++){
		for(let x = 0; x < width/10; x++){
			terrainNoiseVal = noise((x*10+player.x)*terrainNoiseScale, (y*10+player.y)*terrainNoiseScale);
			fill(terrainNoiseVal*255);
			rect(x*10, y*10, 10, 10);
		}
	}

	// Process player movement
	if(keyIsDown(LEFT_ARROW)) player.x -= player.moveSpeed;
	if(keyIsDown(RIGHT_ARROW)) player.x += player.moveSpeed;

	if(keyIsDown(UP_ARROW)) player.y -= player.moveSpeed;
	if(keyIsDown(DOWN_ARROW)) player.y += player.moveSpeed;

	fill(0, 180, 0);
	ellipse(width/2, height/2, player.size, player.size);
}
