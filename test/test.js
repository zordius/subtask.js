'use strict';

var assert = require('chai').assert,
    ST = require('../subtask.js');

describe('subtask', function () {
    it('should be a function', function (done) {
        assert.equal('function', typeof ST);
        done();
    });

    it('should be an instance with execute()', function (done) {
        assert.equal('function', typeof ST().execute);
        done();
    });

    it('.isSubtask should return true/false', function (done) {
        assert.equal(true, ST.isSubtask(ST(1)));
        assert.equal(false, ST.isSubtask(3));
        assert.equal(false, ST.isSubtask(function () {}));
        done();
    });
});

describe('subtask.execute', function () {
    it('should return undefined', function (done) {
        ST().execute(function (D) {
            assert.equal(undefined, D);
            done();
        });
    });

    it('should return 0', function (done) {
        ST(0).execute(function (D) {
            assert.equal(0, D);
            done();
        });
    });

    it('should return 1', function (done) {
        ST(1).execute(function (D) {
            assert.equal(1, D);
            done();
        });
    });

    it('should return OK', function (done) {
        ST('OK').execute(function (D) {
            assert.equal('OK', D);
            done();
        });
    });

    it('should return original hash', function (done) {
        ST({a: 1, b: 0}).execute(function (D) {
            assert.deepEqual({a: 1, b: 0}, D);
            done();
        });
    });

    it('should wrap function', function (done) {
        ST(function (cb) {
           cb('abc');
        }).execute(function (D) {
            assert.deepEqual('abc', D);
            done();
        });
    });

    it('should not run wraped function without .execute', function (done) {
        var D = 0;
        ST(function (cb) {
            D = 1;
            cb(2);
        });
        setTimeout(function () {
            assert.equal(0, D);
            done();
        }, 100);
    });

    it('should be chainable', function (done) {
        var D = 0;
        ST(2).execute(function () {
            D++;
        }).execute(function () {
            assert.equal(1, D);
            done();
        });
    });

    it('should run wraped function only 1 time', function (done) {
        var D = 0;
        ST(function (cb) {
            D++;
            cb(D);
        }).execute(function () {
            assert.equal(1, D);
        }).execute(function (R) {
            assert.equal(1, D);
            assert.equal(1, R);
            done();
        });
    });

    it('should handle hashed subtask', function (done) {
        ST({a: 1, b: 0, c: ST(3)}).execute(function (D) {
            assert.deepEqual({a: 1, b: 0, c: 3}, D);
            done();
        });
    });
});

describe('predefined sync subtask', function () {
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
});

describe('predefined async subtask', function () {
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

});

describe('subtask.next', function () {
    var queueTask = function (number) {
            return jobOne(number).next(jobTwo);
        },

        jobOne = function (input) {
            return ST(input * 2);
        },

        jobTwo = function (input) {
            return ST(input + 3);
        };

    it('should return a subtask', function (done) {
        assert.equal(true, ST.isSubtask(ST(3).next()));
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
});
