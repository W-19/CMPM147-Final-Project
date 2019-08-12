class Wall{
	constructor(x, y){
		this.x = x;
		this.y = y;
	}

	screenCoords(){
		return [this.x-player.x, this.y-player.y]; // why not +width/2 and +height/2??
	}

	onScreen(){
		sc = this.screenCoords();
		return sc[0] > -Wall.size && sc[0] < widthPlusWallSize && sc[1] > -Wall.size && sc[1] < heightPlusWallSize;
	}

	draw(){
		sc = this.screenCoords();
		rect(sc[0]-Wall.size/2, sc[1]-Wall.size/2, Wall.size, Wall.size);
	}
}
Wall.size = 10;
Wall.color = [0, 0, 0];
