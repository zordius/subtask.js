'use strict';

var assert = require('chai').assert,
    ST = require('../subtask.js');

describe('subtask', function () {
    it('should be a function', function (done) {
        assert.equal('function', typeof ST);
        done();
    });

    it('should be an instance with execute()', function (done) {
        assert.equal('function', typeof (new ST()).execute);
        done();
    });
});

describe('subtask.execute', function () {
    it('should return undefined', function (done) {
        (new ST()).execute(function (D) {
            assert.equal(undefined, D);
            done();
        });
    });

    it('should return 0', function (done) {
        (new ST(0)).execute(function (D) {
            assert.equal(0, D);
            done();
        });
    });

    it('should return 1', function (done) {
        (new ST(1)).execute(function (D) {
            assert.equal(1, D);
            done();
        });
    });

    it('should return OK', function (done) {
        (new ST('OK')).execute(function (D) {
            assert.equal('OK', D);
            done();
        });
    });

    it('should return original hash', function (done) {
        (new ST({a: 1, b: 0})).execute(function (D) {
            assert.deepEqual({a: 1, b: 0}, D);
            done();
        });
    });
});
