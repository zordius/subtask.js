'use strict';

var assert = require('chai').assert,
    ST = require('../subtask.js');

describe('subtask.after()', function () {
    it('should return a new updated task creator', function (done) {
        var st = ST.after(function () {}, function () {});
        assert.equal('function', typeof st);
        assert.equal(true, ST.isSubtask(st()));
        done();
    });

    it('should keep original task context', function (done) {
        var originalTask = function () {
            var task = ST(1);
            task.test ='OK!';
            return task;
        },
        newTask = ST.after(originalTask, function (task) {
            assert.equal('O!', this.Test);
        });

        newTask.apply({Test: 'O!'}).execute(function (R) {
            assert.equal(1, R);
            assert.equal('OK!', this.test);
            done();
        });
    });

    it('should change task context', function (done) {
        var originalTask = function () {
            var task = ST(1);
            task.test ='OK!';
            return task;
        },
        newTask = ST.after(originalTask, function (task) {
            assert.equal('K~', this.Test);
        }, {Test: 'K~'});

        newTask.apply({Test: 'O!'}).execute(function (R) {
            assert.equal(1, R);
            assert.equal('OK!', this.test);
            done();
        });
    });

    it('should pass arguments into old task creator', function (done) {
        var originalTask = function (I) {
            return ST(I*2);
        };

        ST.after(originalTask, function (task) {
            // do nothing....
        })(3).execute(function (R) {
            assert.equal(6, R);
            done();
        });
    });

    it('should pass arguments into task updator', function (done) {
        var originalTask = function (I) {
            return ST(I*2);
        };

        ST.after(originalTask, function (task, args) {
            assert.equal(3, args[0]);
            done();
        })(3);
    });

    it('should create updated task', function (done) {
        var originalTask = function (I) {
            return ST(I*2);
        };

        ST.after(originalTask, function (task, args) {
            return task.transform(function (R) {
                return R * 5;
            });
        })(3).execute(function (D) {
            assert.equal(30, D);
            done();
        });
    });
});
