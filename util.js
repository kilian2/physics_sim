export class Line {
    constructor(p1X, p1Y, p2X, p2Y){
        this.p1X = p1X;
        this.p1Y = p1Y;
        this.p2X = p2X;
        this.p2Y = p2Y;
    }
}

export function checkLineLineCollision (/** @type {Line} */ line1, /** @type {Line} */ line2){
    return line1.p1X === line2.p1X && line1.p1Y === line2.p1Y && 
    line1.p2X === line2.p2X && line1.p2Y === line2.p2Y;
}