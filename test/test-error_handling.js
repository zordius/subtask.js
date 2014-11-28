'use strict';

var assert = require('chai').assert,
    ST = require('../subtask.js'),
    itNotIncludeNode8 = function (desc, cb) {
        (process.version.match(/^v0.8/) ? it.skip : it)(desc, cb);
    };

describe('subtask error handling', function () {
    it('should nothing bad when task created', function (done) {
        var badTask = function (id) {
            return ST(function (resolve) {
                resolve(id.a.b.c);
            });
        };
        done();
    });

    it('should handle exception inside task', function (done) {
        var badTask = function (id) {
            return ST(function (cb) {
                cb(id.a.b.c);
            });
        };

        badTask(123).then(function (D) {
            assert.equal(undefined, D);
        }, function (F) {
            assert.equal(true, F instanceof Error);
            done();
        });
    });

    it('should handle exception inside .then()', function (done) {
        var exec = 0;

        ST().then(function (R) {
            exec++;
            return R.ok;
        }).then(function (R) {
            exec++;
        }, function (E) {
            error.a.b = 1;
        }).then(null, function (E) {
            assert.equal(1, exec);
            assert.equal(true, E instanceof Error);
            done();
        });
    });
});
