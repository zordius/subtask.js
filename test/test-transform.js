'use strict';

var assert = require('chai').assert,
    ST = require('../subtask.js');

describe('subtask.execute() cache', function () {
    var called = 0,
        testTask = function (id) {
            return ST(function (cb) {
                setTimeout(function () {
                    called++;
                    cb(called);
                }, 200);
            });
        };

    it('should executed only 1 time', function (done) {
        var T = testTask(1);

        T.execute(function (D) {
            assert.equal(1, D);
        });

        setTimeout(function () {
            T.execute(function (D) {
                assert.equal(1, D);
                done();
            });
        }, 100);
    });
});
