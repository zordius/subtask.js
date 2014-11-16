'use strict';

var assert = require('chai').assert,
    ST = require('../subtask.js');

describe('subtask', function () {
    it('should be a function', function (done) {
        assert.equal('function', typeof ST);
        done();
    });

    it('should create a subtask with execute()', function (done) {
        assert.equal('function', typeof ST().execute);
        done();
    });

    it('.isSubtask() should return true/false', function (done) {
        assert.equal(true, ST.isSubtask(ST(1)));
        assert.equal(false, ST.isSubtask(3));
        assert.equal(false, ST.isSubtask(function () {}));
        done();
    });
});
