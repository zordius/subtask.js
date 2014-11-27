'use strict';

var assert = require('chai').assert,
    ST = require('../subtask.js');

describe('example: task input validation', function () {
    var getProductByIdTask = function(id) {
            if (!id) {
                return ST();
            }

            return ST(function (cb) {
                cb({
                    title: 'this is a mocked product',
                    id: id,
                });
            });
        };

    it('should safe when no id', function (done) {
        getProductByIdTask(0).then(function (R) {
            assert.equal(undefined, R);
            done();
        });
    });

    it('should works well when id ok', function (done) {
        getProductByIdTask(3).then(function (R) {
            assert.deepEqual({
                title: 'this is a mocked product',
                id: 3
            }, R);
            done();
        });
    });

    describe('example: pipes', function () {
        var searchProductsTasks = function (keyword) {
                return ST(function (cb) {
                    cb({
                        list: [1, 3, 0],
                        keyword: keyword
                    });
                });
            };

        it('task: get first searched product', function (done) {
            searchProductsTasks('test')
            .pick('list.0')
            .then(getProductByIdTask)
            .then(function (D) {
                assert.deepEqual({
                    title: 'this is a mocked product',
                    id: 1
                }, D);
                done();
            });
        });

        it('task: get 3rd searched product, not valid', function (done) {
            searchProductsTasks('test')
            .pick('list.2')
            .then(getProductByIdTask)
            .then(function (D) {
                assert.deepEqual(undefined, D);
                done();
            });
        });
    });
});
