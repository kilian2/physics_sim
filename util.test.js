import { describe, expect, test } from '@jest/globals';
import {Line, checkLineLineCollision, checkLineLineCollisionConvoluted} from './util.js';

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
