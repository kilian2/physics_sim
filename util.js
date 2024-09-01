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
            //TODO: check if this makes sense
            return null;
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
        const checkPolyLineCollisionReturn = checkPolyLineCollision(points2, line);
        if (checkPolyLineCollisionReturn){
            return {collisionPoint: checkPolyLineCollisionReturn, collisionLine: line};
        }
        //TODO: check if one polygon is in the other polygon
    }
    return null;
}

export function checkPolyLineCollision(/** @type {Array<{x, y}>} */ vertices, /** @type {Line} */ line){
    for (let i = 0; i < vertices.length; i++) {
        const currentPoint = vertices[i];
        const nextPoint = i < vertices.length -1 ? vertices[i + 1] : vertices[0];
        const l = new Line(currentPoint.x, currentPoint.y, nextPoint.x, nextPoint.y);
        const checkLineLineCollisionReturn = checkLineLineCollision(l, line);
        if (checkLineLineCollisionReturn) {
            return checkLineLineCollisionReturn;
        }
    }
    return null;
}

export function checkPolyCircleCollision(/** @type {Array<x, y>}>} */ vertices, {x, y, radius}) {
    for (let i = 0; i < vertices.length; i++) {
        const currentPoint = vertices[i];
        const nextPoint = i < vertices.length -1 ? vertices[i + 1] : vertices[0];
        const line = new Line(currentPoint.x, currentPoint.y, nextPoint.x, nextPoint.y);
        const lineCircleCollisionReturn = checkLineCircleCollision(line, {x, y, radius});
        if (lineCircleCollisionReturn) {
            return lineCircleCollisionReturn;
        }
    }
    return null;
}

export function checkLineCircleCollision(/** @type {Line} */ line, {x, y, radius}){
    const x1 = line.p1X, x2 = line.p2X, cx = x;
    const y1 = line.p1Y, y2 = line.p2Y, cy = y;
    if(checkIfPointInCircle(x1, y1, cx, cy, radius))  return {x: x1, y: y1};
    if(checkIfPointInCircle(x2, y2, cx, cy, radius)) return {x: x2, y: y2};
    const a = x2*cx + x1*x1 - x2*x1 - x1*cx + (y2*cy + y1*y1 - y2*y1 - y1*cy);
    const b = 2*x2*x1 - x2*x2 -x1*x1 + (2*y2*y1 - y2*y2 -y1*y1);
    if (b === 0) {throw new Error ("Would divide by zero, check whats going on!");}
    const t = -a / b;
    if (t > 1 || t < 0) return null;
    const closestX = x1 + t * (x2 - x1);
    const closestY = y1 + t * (y2 - y1);
    const distanceLineToCircleCenterSquared =  (cx - closestX) ** 2 + (cy - closestY) ** 2;
    if (distanceLineToCircleCenterSquared - radius ** 2 < epsilon) {
        return {x: closestX, y: closestY};
    }

    return null;
}

function checkIfPointInCircle(px, py, cx, cy, r) {
    return ((cx - px) ** 2 + (cy - py) ** 2 <= r ** 2);
}

export function normalize( /**@type {{x: number, y: number}} */ vector) {
    const length = Math.hypot(vector.x, vector.y);
    return {x: vector.x / length, y: vector.y / length};
}

export function getOrthoNormal( /**@type {{x: number, y: number}} */ vector) {
    if (vector.x === 0 && vector.y !== 0) {
        return {x : 1, y : 0}
    } else if (vector.y === 0 && vector.x !== 0) {
        return {x: 0, y: 1};
    } else if ( (vector.x === 0 && vector.y === 0)) {
        return {x: 0, y: 0};
    }
    else {
        let x = (-1*vector.y) / vector.x;
        const len = Math.hypot(x, 1);
        x = x / len;
        const y = 1 / len;
        return {x: x, y: y};
    }
}

