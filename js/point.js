class Point{
	constructor(x=0, y=0){
		this.x = x;
		this.y = y;
	}
}
Point.prototype.toString= function pointToString(){
	return "(" + this.x + ", " + this.y + ")";
}
