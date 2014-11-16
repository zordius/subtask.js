'use strict';

var assert = require('chai').assert,
    ST = require('../subtask.js');

describe('predefined asynchronize subtask', function () {
    var timeTask = function (start, end) {
            return ST({
                start: start,
                end: end,
                valid: validateTask(start, end)
            });
        },

        validateTask = function (start, end) {
            return ST(function (cb) {
                setTimeout(function () {
                    cb(start < end);
                }, 10);
            });
        };

    it('should return a subtask', function (done) {
        assert.equal('function', (typeof timeTask(0, 1).execute));
        done();
    });

    it('should executed correct', function (done) {
        timeTask(0, 1).execute(function (D) {
            assert.deepEqual({
                start: 0,
                end: 1,
                valid: true
            }, D);
            done();
        });
    });

    it('should executed correct with different input', function (done) {
        timeTask(3, 2).execute(function (D) {
            assert.deepEqual({
                start: 3,
                end: 2,
                valid: false
            }, D);
            done();
        });
    });

    it('should cached naturally', function (done) {
        timeTask(3, 2).execute().execute(function (D) {
            // this increase coverage
            done();
        });
    });
});
