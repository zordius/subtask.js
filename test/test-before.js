'use strict';

var assert = require('chai').assert,
    ST = require('../subtask.js');

describe('subtask.before()', function () {
    it('should return a new task creator', function (done) {
        var st = ST.before(function () {}, function () {});
        assert.equal('function', typeof st);
        assert.equal(true, ST.isSubtask(st()));
        done();
    });

    it('should keep original task context', function (done) {
        var originalTask = function () {
            var task = ST(1);
            task.test ='OK';
            return task;
        },
        newTask = ST.before(originalTask, function () {
            assert.equal('O!', this.test);
        }),
        P = newTask.apply({test: 'O!'});

        assert.equal('OK', P.test);
        done();
    });

    it('should use another task context', function (done) {
        var originalTask = function () {
            var task = ST(1);
            task.test ='OK';
            return task;
        },
        newTask = ST.before(originalTask, function () {
            assert.equal('K~', this.test);
        }, {test: 'K~'});

        newTask.apply({test: 'O!'}).then(function () {
            assert.equal('OK', this.test);
            done();
        });
    });

    it('should return task by return new task', function (done) {
        var originalTask = function () {
            var task = ST(1);
            task.test ='OK';
            return task;
        },
        newTask = ST.before(originalTask, function (task, args) {
            if (args.length && args[0]) {
                return ST(args[0] * 2);
            }
        });

        newTask(0).then(function (R) {
            assert.equal(1, R);
            assert.equal('OK', this.test);
            newTask(1).then(function (R) {
                assert.equal(2, R);
                assert.equal(undefined, this.test);
                done();
            });
        });
    });

    it('should create task by return values', function (done) {
        var originalTask = function () {
            var task = ST(1);
            task.test ='OK';
            return task;
        },
        newTask = ST.before(originalTask, function (task, I) {
            return {a: 1, b: 2};
        });

        newTask(0).then(function (R) {
            assert.deepEqual({a: 1, b: 2}, R);
            assert.equal(undefined, this.test);
            done();
        });
    });
});
