'use strict';

var assert = require('chai').assert,
    ST = require('../subtask.js');

describe('subtask.then()', function () {
    it('should receive undefined when input undefined', function (done) {
        ST().then(function (D) {
            assert.equal(undefined, D);
            done();
        });
    });

    it('should receive 0 when input 0', function (done) {
        ST(0).then(function (D) {
            assert.equal(0, D);
            done();
        });
    });

    it('should receive 1 when input 1', function (done) {
        ST(1).then(function (D) {
            assert.equal(1, D);
            done();
        });
    });

    it('should receive OK when input OK', function (done) {
        ST('OK').then(function (D) {
            assert.equal('OK', D);
            done();
        });
    });

    it('should receive original hash', function (done) {
        ST({a: 1, b: 0}).then(function (D) {
            assert.deepEqual({a: 1, b: 0}, D);
            done();
        });
    });

    it('should wrap function', function (done) {
        ST(function (resolve) {
           resolve('abc');
        }).then(function (D) {
            assert.deepEqual('abc', D);
            done();
        });
    });

    it('should run wraped function without .then', function (done) {
        var D = 0;
        ST(function (resolve) {
            D = 1;
            resolve(2);
        });
        setTimeout(function () {
            assert.equal(1, D);
            done();
        }, 100);
    });

    it('should be chainable', function (done) {
        var D = 0;
        ST(2).then(function () {
            D++;
        }).then(function () {
            assert.equal(1, D);
            done();
        });
    });

    it('should run wraped function only 1 time', function (done) {
        var D = 0;
        ST(function (resolve) {
            D++;
            resolve(D);
        }).then(function () {
            assert.equal(1, D);
        }).then(function () {
            assert.equal(1, D);
            done();
        });
    });

    it('should handle hashed subtask', function (done) {
        ST({a: 1, b: 0, c: ST(3)}).then(function (D) {
            assert.deepEqual({a: 1, b: 0, c: 3}, D);
            done();
        });
    });
});
