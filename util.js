//@ts-check

export class Line {
    constructor(p1X, p1Y, p2X, p2Y){
        this.p1X = p1X;
        this.p1Y = p1Y;
        this.p2X = p2X;
        this.p2Y = p2Y;
    }
}

const epsilon = 1e-10;

export function checkLineLineCollision (/** @type {Line} */ line1, /** @type {Line} */ line2) {
    const x1 = line1.p1X, x2 = line1.p2X, x3 = line2.p1X, x4 = line2.p2X;
    const y1 = line1.p1Y, y2 = line1.p2Y, y3 = line2.p1Y, y4 = line2.p2Y;
    const b1 = x3 - x1, b2 = y3 - y1;
    
    /*
    A line segement from (x1, y1) to (x2, y2) can be represented as
    x = x1 + t(x2 - x1)
    y = y1 + t(y2 - y1)
    with 0 <= t <= 1
    If line1 is parameterized by t and line2 parameterized by u the folowing system of equations can be
    created by setting both equations equal:
    I: (x2 - x1)*t + (x3 - x4)u = x3 - x1
    II: (y2 - y1)*t + (y3 - y4)u = y3 - y1
    This system of equations can be solved for u and t using cramers rule by first 
    determining detA, detU, detT
    */
    
    const detA = (x2 - x1) * (y3 - y4) - ((x3 - x4) * (y2 - y1));
    if (Math.abs(detA) < epsilon) {
        if (Math.abs((Math.min(x1, x2) - Math.min(x3, x4)) +
        (Math.min(y1, y2) - Math.min(y3, y4))) < epsilon) {
            return undefined;
        } else {
            return null;
        }
    } 

    const detT = (x3 - x1) * (y3 - y4) - ((x3 - x4) * (y3 - y1));
    const detU = (x2 - x1) * (y3 - y1) - ((x3 - x1) * (y2 - y1));
    const t = detT/detA;
    const u = detU/detA;

    if(t < 0 || t > 1 || u < 0 || u > 1) return null;

    const x = x1 + t * (x2 - x1);
    const y = y1 + t * (y2 - y1);

    return {x: x, y: y};
}

export function checkLineLineCollisionConvoluted (/** @type {Line} */ line1, /** @type {Line} */ line2){
    const {slope: a1, offset: b1} = getSlopeAndOffsetFromLine(line1);
    const {slope: a2, offset: b2} = getSlopeAndOffsetFromLine(line2);
    const p = getIntersectionPointForLineFunctions(a1, b1, a2, b2);
    if(!p) {return null;}
    const pointIsOnLine1 = isPointOnLine(p.x, p.y, line1);
    const pointIsOnLine2 = isPointOnLine(p.x, p.y, line2);
    return pointIsOnLine1 && pointIsOnLine2 ? p : null;
}

function isPointOnLine (px, py, /** @type {Line} */ line) {
    const {slope: a, offset: b} = getSlopeAndOffsetFromLine(line);
    let pointIsOnFunction = false;
    if (!isFinite(a)) {
        pointIsOnFunction = Math.abs(px - b) < epsilon;
    } else {
        pointIsOnFunction = Math.abs(a * px + b - py) < epsilon;
    }
    const xWithinLineSegment = px >= Math.min(line.p1X, line.p2X) && px <= Math.max(line.p1X, line.p2X);
    const yWithinLineSegment = py >= Math.min(line.p1Y, line.p2Y) && py <= Math.max(line.p1Y, line.p2Y);
    return pointIsOnFunction && xWithinLineSegment && yWithinLineSegment;
}

function getSlopeAndOffsetFromLine(/** @type {Line} */ line) {
    const dx = line.p2X - line.p1X;
    const dy = line.p2Y - line.p1Y;
    if (Math.abs(dx) < epsilon) {
        return {slope: Infinity, offset: line.p1X};
    }
    const slope = (line.p2Y - line.p1Y) / (line.p2X - line.p1X);
    const offset = line.p1Y - slope * line.p1X;
    return {slope: slope, offset: offset};
}

function getIntersectionPointForLineFunctions(a1, b1, a2, b2) {
    if (Math.abs(b1 - b2) < epsilon && isFinite(a1) && isFinite(a2)) {
        return {x: 0, y: b1};
    }
    if (!isFinite(a1) && !isFinite(a2)) {
        if(Math.abs(b2-b1) < epsilon) {
            return {x: b1, y: undefined};
        }
    }
    if (!isFinite(a1)) {
        return {x: b1, y: a2 * b1 + b2};
    }
    if(!isFinite(a2)) {
        return {x: b2, y: a1 * b2 + b1};
    }
    if (Math.abs(a1 - a2) < epsilon) {return null;}

    const x = (b2 - b1) / (a1 - a2);
    const y = a1 * x + b1;
    return {x: x, y: y};
}