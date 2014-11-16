'use strict';

var assert = require('chai').assert,
    ST = require('../subtask.js'),
    itNotIncludeNode8 = function (desc, cb) {
        (process.version.match(/^v0.8/) ? it.skip : it)(desc, cb);
    };

describe('subtask context api', function () {
    it('this.errors should be accessiable in subtask constructor', function (done) {
        ST(function (cb) {
            assert.equal(0, this.errors.length);
            cb('OK!');
        }).execute(function (D) {
            assert.equal('OK!', D);
            done();
        });
    });

    it('this.errors should be accessiable in a transform function', function (done) {
        ST().quiet().transform(function (R) {
            assert.equal(0, this.errors.length);
            return R.a.b;
        }).transform(function (R) {
            assert.equal(1, this.errors.length);
        }).execute(function (D) {
            assert.equal(undefined, D);
            done();
        });
    });

    it('this.errors should be accessiable in a execute callback', function (done) {
        ST().quiet().transform(function (R) {
            return R.a.b;
        }).execute(function (D) {
            assert.equal(1, this.errors.length);
            assert.equal(undefined, D);
            done();
        });
    });

    it('this.error() should add one delayed exception', function (done) {
        ST().quiet().transform(function (R) {
            this.error('NOT OK!');
        }).execute(function (D) {
            assert.equal(1, this.errors.length);
            assert.equal('NOT OK!', this.errors[0].message);
            assert.equal(undefined, D);
            done();
        });
    });

    itNotIncludeNode8('this.error() should throw a delayed exception', function (done) {
        var domain = require('domain').create(),
            exec = 0,
            err = 0;

        domain.on('error', function (E) {
            assert.equal('NOT OK!', E[0].message);
            err++;
        });

        domain.run(function () {
            ST().transform(function () {
                exec++;
                this.error('NOT OK!');
            }).execute(function () {
                assert.equal(1, this.errors.length);
                assert.equal('NOT OK!', this.errors[0].message);
                exec++;
            });
        });

        setTimeout(function () {
            domain.dispose();
            assert.equal(2, exec);
            assert.equal(1, err);
            done();
        }, 200);
    });
});
