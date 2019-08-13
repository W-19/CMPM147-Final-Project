const BUFFER = 12;

class Wall{
	constructor(pos){
		this.pos = pos; // a Point
	}

	screenCoords(){
		return world2Screen_1Arg(this.pos);
	}

	onScreen(){
		sc = this.screenCoords();
		return sc.x > -Wall.size && sc.x < widthPlusWallSize && sc.y > -Wall.size && sc.y < heightPlusWallSize;
	}

	drawAndCheckCollision(){
		// collision
		if(dist(this.pos.x, this.pos.y, player.pos.x, player.pos.y) < COLLISION_CHECK_DIST){
			fill(Wall.contactColor);
			if(this.pos.x < player.pos.x-BUFFER){
				player.blocked.left = true;
			}
			else if(this.pos.x > player.pos.x+BUFFER){
				player.blocked.right = true;
			}

			if(this.pos.y < player.pos.y-BUFFER){
				player.blocked.up = true;
			}
			else if(this.pos.y > player.pos.y+BUFFER){
				player.blocked.down = true;
			}
		}
		else{
			fill(Wall.color);
		}

		// drawing
		sc = this.screenCoords();
		rect(sc.x-Wall.size/2, sc.y-Wall.size/2, Wall.size, Wall.size);
	}
}
Wall.size = 10;
Wall.color = [0, 0, 0];
Wall.contactColor = [255, 120, 0];
