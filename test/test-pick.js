'use strict';

var assert = require('chai').assert,
    ST = require('../subtask.js');

describe('subtask.pick()', function () {
    it('should get result by path', function (done) {
        ST({
            a: {
                b: 'no',
                c: 'OK!'
            },
            'a.c': 'no'
        })
        .pick('a.c')
        .execute(function (D) {
            assert.equal('OK!', D);
            done();
        });
    });

    it('should be safe when pick from undefined', function (done) {
        ST().pick('a.c')
        .execute(function (D) {
            assert.equal(undefined, D);
            done();
        });
    });
});
