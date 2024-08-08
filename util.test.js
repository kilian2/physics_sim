import { describe, expect, test } from '@jest/globals';
import {Line, checkLineLineCollision} from './util.js';

//const checkLineLineCollision = require('./util');

describe('checkLineCollision', () => {
    test('returns true when lines are identical', () => {
        const line1 = new Line(0, 0, 1, 1);
        const line2 = new Line(0, 0, 1, 1);

        expect(checkLineLineCollision(line1, line2)).toBe(true);
    });

    test('returns false when lines do not collide', () => {
        const line1 = new Line(0, 0, 1, 1);
        const line2 = new Line(0, 2, 3, 3);

        expect(checkLineLineCollision(line1, line2)).toBe(false);
    });
});