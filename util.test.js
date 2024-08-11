import { describe, expect, test } from '@jest/globals';
import {Line, checkLineLineCollision, checkLineLineCollisionConvoluted, checkLineCircleCollision,
    checkPolyCircleCollision
} from './util.js';

//const checkLineLineCollision = require('./util');

describe('checkLineLineCollision', () => {
    test('returns undefined when lines are identical', () => {
        const line1 = new Line(0, 0, 1, 1);
        const line2 = new Line(0, 0, 1, 1);

        expect(checkLineLineCollision(line1, line2)).toBe(undefined);
    });

    test('returns null when lines do not collide', () => {
        const line1 = new Line(0, 0, 1, 1);
        const line2 = new Line(0, 2, 3, 3);

        expect(checkLineLineCollision(line1, line2)).toBe(null);
    });

    test('returns correct intersection point when lines intersect', () => {
        const x1 = -9, x2 = -6, x3 = -5, x4 = -10;
        const y1 = -2, y2 = 2, y3 = 1, y4 = 2;
        const line1 = new Line(x1, y1, x2, y2);
        const line2 = new Line(x3, y3, x4, y4);
        const p1 = checkLineLineCollision(line1, line2);
        const p2 = checkLineLineCollision(line2, line1);

        expect(p1.x).toBeCloseTo(-6.521739, 5);
        expect(p1.y).toBeCloseTo(1.304347, 5);
        expect(p2.x).toBeCloseTo(-6.521739, 5);
        expect(p2.y).toBeCloseTo(1.304347, 5);
    });
});

describe('checkLineLineCollisionConvoluted', () => {

    test('returns correct intersection point when lines intersect', () => {
        const x1 = -9, x2 = -6, x3 = -5, x4 = -10;
        const y1 = -2, y2 = 2, y3 = 1, y4 = 2;
        const line1 = new Line(x1, y1, x2, y2);
        const line2 = new Line(x3, y3, x4, y4);
        const p1 = checkLineLineCollisionConvoluted(line1, line2);
        const p2 = checkLineLineCollisionConvoluted(line2, line1);

        expect(p1.x).toBeCloseTo(-6.521739, 5);
        expect(p1.y).toBeCloseTo(1.304347, 5);
        expect(p2.x).toBeCloseTo(-6.521739, 5);
        expect(p2.y).toBeCloseTo(1.304347, 5);
    });
});

describe('checkLineCircleCollision', () => {

    

    test('returns false if line does not intersect circle', () => {
        const circle = {x: -1.5, y: 2, radius: 3};
        const notIntersectingLine1 = new Line(1.5, -0.5, 2, 5);
        const notIntersectingLine2 = new Line(-7, -1, -4.6, 1.8);
        const intersectingLine1 = new Line(1.17, 0.17, 1.7, 2.8);
        
        expect(checkLineCircleCollision(notIntersectingLine1, circle)).toBe(false);
        expect(checkLineCircleCollision(notIntersectingLine2, circle)).toBe(false);
        expect(checkLineCircleCollision(intersectingLine1, circle)).toBe(true);     
    });

    test('tests collision of a circle with 4 lines forming a square, lineBC should collide and the other three should not',
        () => {
            
            const circle = {x: 465.3666687011719, y: 208, radius: 50};
            const vertices = [
                {x: 584.375394585844, y: 159.0087274077592},
                {x: 484.3753961089311, y: 158.99127411532788},
                {x: 484.35794281649976, y: 258.99127259224076},
                {x: 584.3579412934126, y: 259.0087258846721}     
            ];
        
            const lineAB = new Line(vertices[0].x, vertices[0].y, vertices[1].x, vertices[1].y);
            
            /*This line should intersect at {x: 484.375396, y: 161.754262} and at {x: 484.375396, y: 254.245738}.
            The closes point at the line to the center of the cirlce should be at {x: 484. 375396, y: 254.245738}
            at his point the distance to the circlecenter should be 19.008727
            */
            const lineBC = new Line(vertices[1].x, vertices[1].y, vertices[2].x, vertices[2].y);
            
            const lineCD = new Line(vertices[2].x, vertices[2].y, vertices[3].x, vertices[3].y);
            const lineDA = new Line(vertices[3].x, vertices[3].y, vertices[0].x, vertices[0].y);

            expect(checkLineCircleCollision(lineAB, circle)).toBe(false);
            expect(checkLineCircleCollision(lineBC, circle)).toBe(true);
            expect(checkLineCircleCollision(lineCD, circle)).toBe(false);
            expect(checkLineCircleCollision(lineDA, circle)).toBe(false);
        }
    )
});

describe('checkPolyCircleCollision', () => {

    const circle = {x: 465.3666687011719, y: 208, radius: 50};
    const vertices = [
        {x: 584.375394585844, y: 159.0087274077592},
        {x: 484.3753961089311, y: 158.99127411532788},
        {x: 484.35794281649976, y: 258.99127259224076},
        {x: 584.3579412934126, y: 259.0087258846721}     
    ];

    test('returns true if there is a collision', () => {
        expect(checkPolyCircleCollision(vertices, circle)).toBe(true);
    });
})


