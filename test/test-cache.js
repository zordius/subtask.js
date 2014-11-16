'use strict';

var assert = require('chai').assert,
    ST = require('../subtask.js'),
    itNotIncludeNode8 = function (desc, cb) {
        (process.version.match(/^v0.8/) ? it.skip : it)(desc, cb);
    };

describe('subtask.execute cache', function () {
    var called = 0,
        testTask = function (id) {
            return ST(function (cb) {
                setTimeout(function () {
                    called++;
                    cb(called);
                }, 200);
            });
        };

    it('should executed only 1 time', function (done) {
        var T = testTask(1);

        T.execute(function (D) {
            assert.equal(1, D);
        });

        setTimeout(function () {
            T.execute(function (D) {
                assert.equal(1, D);
                done();
            });
        }, 100);
    });
});

describe('subtask.cache with extended taskPool', function () {
    var called = 0,
        extendedCacheTask = {
            create: function () {
                return ST.cache.apply(this, arguments);
            },
            taskPool: {},
            taskKey: 'local_'
        },

        cachedTask = function (id) {
            return extendedCacheTask.create(function (cb) {
                called++;
                cb(id);
            }, id);
        };

    it('should be same instance', function (done) {
        var T = cachedTask(5);

        T.testinstance = true;
        assert.equal(true, cachedTask(5).testinstance);
        assert.deepEqual(extendedCacheTask.taskPool['local_5'], T);
        done();
    });

    it('should be different instance', function (done) {
        assert.equal(true, cachedTask(5).testinstance);
        assert.equal(undefined, cachedTask(7).testinstance);
        done();
    });
});

describe('subtask.cache', function () {
    var called = 0,
        cachedTask = function (id) {
            return ST.cache(function (cb) {
                called++;
                cb(id);
            }, id, 200);
        };

    it('should default no cache', function (done) {
        var T1 = cachedTask(5);

        assert.equal(undefined, T1.taskkey);
        done();
        T1.testinstance = true;
        assert.equal(undefined, cachedTask(5).testinstance);
    });

    it('should work after initCache', function (done) {
        var T1;

        ST.initCache(100);
        T1 = cachedTask(5);
        T1.testinstance = true;
        assert.equal(true, cachedTask(5).testinstance);
        done();
    });

    it('should be different instance', function (done) {
        assert.equal(true, cachedTask(5).testinstance);
        assert.equal(undefined, cachedTask(7).testinstance);
        done();
    });

    it('should timeout', function (done) {
        assert.equal(true, cachedTask(5).testinstance);
        setTimeout(function () {
            assert.equal(undefined, cachedTask(5).testinstance);
            done();
        }, 500);
    });

    it('should reset taskPool when initCache 2nd time', function (done) {
        // for coverage
        ST.initCache(100);
        done();
    });

    it('should not cached after initCache', function (done) {
        assert.equal(undefined, cachedTask(5).testinstance);
        done();
    });
});
