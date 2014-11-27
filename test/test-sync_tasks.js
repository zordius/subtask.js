'use strict';

var assert = require('chai').assert,
    ST = require('../subtask.js');

describe('predefined synchronize subtask', function () {
    var timeTask = function (start, end) {
            return ST({
                start: start,
                end: end,
                valid: validateTask(start, end)
            });
        },

        validateTask = function (start, end) {
            return ST(start < end);
        };

    it('should return a subtask', function (done) {
        assert.equal('function', (typeof timeTask(0, 1).then));
        done();
    });

    it('should be correct', function (done) {
        timeTask(0, 1).then(function (D) {
            assert.deepEqual({
                start: 0,
                end: 1,
                valid: true
            }, D);
            done();
        });
    });

    it('should .then() correct with different input', function (done) {
        timeTask(3, 2).then(function (D) {
            assert.deepEqual({
                start: 3,
                end: 2,
                valid: false
            }, D);
            done();
        });
    });

    it('should .then() by order', function (done) {
        var exec = 0,
            T = timeTask(3, 2);

        T.then(function () {
            exec++;
            assert.equal(1, exec);
        }).then(function () {
            exec++;
            assert.equal(2, exec);
        }).then(function () {
            exec++;
            assert.equal(3, exec);
            done();
        });
    });
});
