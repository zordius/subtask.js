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
});
