'use strict';

var assert = require('chai').assert,
    ST = require('../subtask.js');

describe('subtask.transform()', function () {
    it('should change results', function (done) {
        ST({a:1, b:2}).transform(function (R) {
            R.c = R.a + R.b;
            return R;
        }).execute(function (D) {
            assert.deepEqual({a:1, b:2, c:3}, D);
            done();
        });
    });

    it('should work well after .execute()', function (done) {
        ST({a:1, b:2}).execute(function (RR) {
            // nothing...
        }).transform(function (R) {
            R.c = R.a + R.b;
            return R;
        }).execute(function (D) {
            assert.deepEqual({a:1, b:2, c:3}, D);
            done();
        });
    });

    it('should return new subtask', function (done) {
        var task = ST(123);
        task.test = 'OK';
        task.transform(function (R) {
            return R * 2;
        }).execute(function (D) {
            assert.equal(undefined, this.test);
            assert.equal(246, D);
            done();
        });
    });
    it('should return original subtask when no input', function (done) {
        var task = ST(123);
        task.test = 'OK';
        task.transform().execute(function (D) {
            assert.equal('OK', this.test);
            assert.equal(123, D);
            done();
        });
    });
});
