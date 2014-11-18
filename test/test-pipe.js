'use strict';

var assert = require('chai').assert,
    ST = require('../subtask.js');

describe('subtask.pipe()', function () {
    var queueTask = function (number) {
            return jobOne(number).pipe(jobTwo);
        },

        jobOne = function (input) {
            return ST(input * 2);
        },

        jobTwo = function (input) {
            return ST(input + 3);
        };

    it('should return a subtask', function (done) {
        assert.equal(true, ST.isSubtask(ST(3).pipe()));
        done();
    });

    it('should be executed ordered', function (done) {
        queueTask(4).execute(function (D) {
            assert.equal(11, D);
            done();
        });
    });

    it('should be executed with different input', function (done) {
        queueTask(1).execute(function (D) {
            assert.equal(5, D);
            done();
        });
    });

    it('should not execute piped tasks without .execute', function (done) {
        var I = 0;
        queueTask(3).pipe(function (cb) {
            I++;
            cb(D + I);
        });

        setTimeout(function () {
            assert.equal(0, I);
            done();
        }, 100);
    });

    it('should executed only 1 time', function (done) {
        var I = 0;
        queueTask(1).pipe(function (D) {
            return ST(function (cb) {
                I++;
                cb(D + I);
            });
        }).execute(function (D) {
            assert.equal(6, D);
            assert.equal(1, I);
        }).execute(function (D) {
            assert.equal(6, D);
            assert.equal(1, I);
            done();
        });
    });

    it('should return original task when input not a task', function (done) {
        var task = ST(123);
        task.OK = 'YES';

        task.pipe().execute(function () {
            assert.equal('YES', this.OK);
            done();
        });
    });

    describe('subtask.transform()', function () {
        it('should transform task result by the function', function (done) {
            queueTask(1)
            .pipe(jobOne)
            .transform(function (R) {
                return R * R;
            }).execute(function (D) {
                assert.equal(100, D);
                done();
            });
        });

        it('should transform first then pipe', function (done) {
            queueTask(1)
            .transform(function (R) {
                return R * R;
            }).pipe(jobOne)
            .execute(function (D) {
                assert.equal(50, D);
                done();
            });
        });
    });
});
