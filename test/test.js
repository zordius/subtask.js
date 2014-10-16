'use strict';

var assert = require('chai').assert,
    ST = require('../subtask.js');

describe('subtask', function () {
    it('should be a function', function (done) {
        assert('function', typeof ST);
        done();
    });

    it('should be an instance with execute()', function (done) {
        assert('function', typeof (new ST()).execute);
        done();
    });
});
