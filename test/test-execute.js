'use strict';

var assert = require('chai').assert,
    ST = require('../subtask.js');

describe('subtask.execute()', function () {
    it('should receive undefined when input undefined', function (done) {
        ST().execute(function (D) {
            assert.equal(undefined, D);
            done();
        });
    });

    it('should receive 0 when input 0', function (done) {
        ST(0).execute(function (D) {
            assert.equal(0, D);
            done();
        });
    });

    it('should receive 1 when input 1', function (done) {
        ST(1).execute(function (D) {
            assert.equal(1, D);
            done();
        });
    });

    it('should receive OK when input OK', function (done) {
        ST('OK').execute(function (D) {
            assert.equal('OK', D);
            done();
        });
    });

    it('should receive original hash', function (done) {
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

    it('should access task self by `this`', function (done) {
        var task = ST(1);

        task.test = 'OK';
        task.execute(function (R) {
            assert.equal('OK', this.test);
            done();
        });
    });
});