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


export function rotatePoints( /** @type {Array<{x: number, y: number}>} */ points, radians, /** @type {{x, y}} */ origin) {
    const /** @type {Array<{x: number, y: number}>} */ rotatedPoints = [];
    const cosRad = Math.cos(radians);
    const sinRad = Math.sin(radians);
    points.forEach(p => {
        rotatedPoints.push({x: cosRad * (p.x - origin.x) - sinRad * (p.y - origin.y) + origin.x, 
            y: sinRad * (p.x - origin.x) + cosRad * (p.y - origin.y) + origin.y});
    })
    return rotatedPoints;
}

export function checkPolyPolyCollision(/** @type {Array<{x, y}>} */ points1, /** @type {Array<{x, y}>} */  points2){
    for (let i = 0; i < points1.length; i++) {
        const currentPoint = points1[i];
        const nextPoint = i < points1.length -1 ? points1[i + 1] : points1[0];
        const line = new Line(currentPoint.x, currentPoint.y, nextPoint.x, nextPoint.y);
        if (checkPolyLineCollision(points2, line)){
            return true;
        }
        //TODO: check if one polygon is in the other polygon
    }
    return false;
}

export function checkPolyLineCollision(/** @type {Array<{x, y}>} */ vertices, /** @type {Line} */ line){
    for (let i = 0; i < vertices.length; i++) {
        const currentPoint = vertices[i];
        const nextPoint = i < vertices.length -1 ? vertices[i + 1] : vertices[0];
        const l = new Line(currentPoint.x, currentPoint.y, nextPoint.x, nextPoint.y);
        if (checkLineLineCollision(l, line)) {
            return true;
        }
    }
    return false;
}

export function checkPolyCircleCollision(/** @type {Array<x, y>}>} */ vertices, {x, y, radius}) {
    for (let i = 0; i < vertices.length; i++) {
        const currentPoint = vertices[i];
        const nextPoint = i < vertices.length -1 ? vertices[i + 1] : vertices[0];
        const line = new Line(currentPoint.x, currentPoint.y, nextPoint.x, nextPoint.y);
        if (checkLineCircleCollision(line, {x, y, radius})) {
            return true;
        }
    }
    return false;
}

export function checkLineCircleCollisionDepreciated(/** @type {Line} */ line, {x, y, radius}){
    const p1ToCircleCenter = {x: x - line.p1X, y: y - line.p1Y};
    const p1ToCircleCenterDistance = Math.hypot(p1ToCircleCenter.x, p1ToCircleCenter.y);
    const p1ToCircleDistance = Math.hypot(p1ToCircleCenter.x, p1ToCircleCenter.y) - radius;
    const p1ToCircleCenterNormalized = {x: p1ToCircleCenter.x / p1ToCircleCenterDistance, y: p1ToCircleCenter.y / p1ToCircleCenterDistance};
    const p1ToP2 = {x: line.p2X - line.p1X, y: line.p2Y - line.p1Y};
    const p1ToP2Distance = Math.hypot(p1ToP2.x, p1ToP2.y);
    //const p1ToP2Normalized = {x: p1ToP2.x / p1ToP2Distance, y: p1ToP2.y / p1ToP2Distance};
    const ratioP1ToP2PointingTowardsCircle = (p1ToCircleCenterNormalized.x * p1ToP2.x + 
    p1ToCircleCenterNormalized.y + p1ToP2.y)/p1ToCircleCenterDistance;
    if (p1ToP2Distance * ratioP1ToP2PointingTowardsCircle > p1ToCircleDistance) return true;
    return false;
}

export function checkLineCircleCollision(/** @type {Line} */ line, {x, y, radius}){
    const x1 = line.p1X, x2 = line.p2X, cx = x;
    const y1 = line.p1Y, y2 = line.p2Y, cy = y;
    if(checkIfPointInCircle(x1, y1, cx, cy, radius) || checkIfPointInCircle(x2, y2, cx, cy, radius)) return true;
    const a = x2*cx + x1*x1 - x2*x1 - x1*cx + (y2*cy + y1*y1 - y2*y1 - y1*cy);
    const b = 2*x2*x1 - x2*x2 -x1*x1 + (2*y2*y1 - y2*y2 -y1*y1);
    if (b === 0) {throw new Error ("Would divide by zero, check whats going on!");}
    const t = -a / b;
    if (t > 1 || t < 0) return false;
    const closestX = x1 + t * (x2 - x1);
    const closestY = y1 + t * (y2 - y1);
    const distanceLineToCircleCenterSquared =  (cx - closestX) ** 2 + (cy - closestY) ** 2;
    if (distanceLineToCircleCenterSquared - radius ** 2 < epsilon) {
        return true;
    }

    return false;
}

function checkIfPointInCircle(px, py, cx, cy, r) {
    return ((cx - px) ** 2 + (cy - py) ** 2 <= r ** 2);
}