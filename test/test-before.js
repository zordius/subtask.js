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
            // do nothing....
        });

        newTask().execute(function () {
            assert.equal('OK', this.test);
            done();
        });
    });

    it('should update task', function (done) {
        var originalTask = function () {
            var task = ST(1);
            task.test ='OK';
            return task;
        },
        newTask = ST.before(originalTask, function (task, I) {
            if (I) {
                return ST(I * 2);
            }
        });

        newTask(0).execute(function (R) {
            assert.equal(1, R);
            newTask(1).execute(function (R) {
                assert.equal(2, R);
                done();
            });
        });
    });
});
