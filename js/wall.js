class Wall{
	constructor(x, y){
		this.x = x;
		this.y = y;
	}

	onScreen(){
		return Math.abs(this.x-player.x) < width/2 && Math.abs(this.y-player.y) < height/2;
	}

	draw(){
		rect(this.x-player.x, this.y-player.y, 10, 10);
	}
}
