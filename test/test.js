'use strict';

var assert = require('chai').assert,
    ST = require('../subtask.js');

describe('subtask', function () {
    it('should be a function', function (done) {
        assert.equal('function', typeof ST);
        done();
    });

    it('should be an instance with execute()', function (done) {
        assert.equal('function', typeof ST().execute);
        done();
    });

    it('.isSubtask should return true/false', function (done) {
        assert.equal(true, ST.isSubtask(ST(1)));
        assert.equal(false, ST.isSubtask(3));
        assert.equal(false, ST.isSubtask(function () {}));
        done();
    });
});

describe('subtask.execute', function () {
    it('should return undefined', function (done) {
        ST().execute(function (D) {
            assert.equal(undefined, D);
            done();
        });
    });

    it('should return 0', function (done) {
        ST(0).execute(function (D) {
            assert.equal(0, D);
            done();
        });
    });

    it('should return 1', function (done) {
        ST(1).execute(function (D) {
            assert.equal(1, D);
            done();
        });
    });

    it('should return OK', function (done) {
        ST('OK').execute(function (D) {
            assert.equal('OK', D);
            done();
        });
    });

    it('should return original hash', function (done) {
        ST({a: 1, b: 0}).execute(function (D) {
            assert.deepEqual({a: 1, b: 0}, D);
            done();
        });
    });

    it('should wrap function', function (done) {
        ST(function (cb) {
           cb('abc');
        }).execute(function (D) {
            assert.deepEqual('abc', D);
            done();
        });
    });

    it('should not run wraped function without .execute', function (done) {
        var D = 0;
        ST(function (cb) {
            D = 1;
            cb(2);
        });
        setTimeout(function () {
            assert.equal(0, D);
            done();
        }, 100);
    });

    it('should be chainable', function (done) {
        var D = 0;
        ST(2).execute(function () {
            D++;
        }).execute(function () {
            assert.equal(1, D);
            done();
        });
    });

    it('should run wraped function only 1 time', function (done) {
        var D = 0;
        ST(function (cb) {
            D++;
            cb(D);
        }).execute(function () {
            assert.equal(1, D);
        }).execute(function (R) {
            assert.equal(1, D);
            assert.equal(1, R);
            done();
        });
    });

    it('should handle hashed subtask', function (done) {
        ST({a: 1, b: 0, c: ST(3)}).execute(function (D) {
            assert.deepEqual({a: 1, b: 0, c: 3}, D);
            done();
        });
    });
});

describe('predefined sync subtask', function () {
    var timeTask = function (start, end) {
            return ST({
                start: start,
                end: end,
                valid: validateTask(start, end)
            });
        },

        validateTask = function (start, end) {
            return ST(start < end);
        };

    it('should return a subtask', function (done) {
        assert.equal('function', (typeof timeTask(0, 1).execute));
        done();
    });

    it('should executed correct', function (done) {
        timeTask(0, 1).execute(function (D) {
            assert.deepEqual({
                start: 0,
                end: 1,
                valid: true
            }, D);
            done();
        });
    });

    it('should executed correct with different input', function (done) {
        timeTask(3, 2).execute(function (D) {
            assert.deepEqual({
                start: 3,
                end: 2,
                valid: false
            }, D);
            done();
        });
    });
});

describe('predefined async subtask', function () {
    var timeTask = function (start, end) {
            return ST({
                start: start,
                end: end,
                valid: validateTask(start, end)
            });
        },

        validateTask = function (start, end) {
            return ST(function (cb) {
                setTimeout(function () {
                    cb(start < end);
                }, 10);
            });
        };

    it('should return a subtask', function (done) {
        assert.equal('function', (typeof timeTask(0, 1).execute));
        done();
    });

    it('should executed correct', function (done) {
        timeTask(0, 1).execute(function (D) {
            assert.deepEqual({
                start: 0,
                end: 1,
                valid: true
            }, D);
            done();
        });
    });

    it('should executed correct with different input', function (done) {
        timeTask(3, 2).execute(function (D) {
            assert.deepEqual({
                start: 3,
                end: 2,
                valid: false
            }, D);
            done();
        });
    });

    it('should cached naturally', function (done) {
        timeTask(3, 2).execute().execute(function (D) {
            // this increase coverage
            done();
        });
    });
});

describe('subtask.pipe', function () {
    var queueTask = function (number) {
            return jobOne(number).pipe(jobTwo);
        },

        jobOne = function (input) {
            return ST(input * 2);
        },

        jobTwo = function (input) {
            return ST(input + 3);
        };

    it('should return a subtask', function (done) {
        assert.equal(true, ST.isSubtask(ST(3).pipe()));
        done();
    });

    it('should be executed ordered', function (done) {
        queueTask(4).execute(function (D) {
            assert.equal(11, D);
            done();
        });
    });

    it('should be executed with different input', function (done) {
        queueTask(1).execute(function (D) {
            assert.equal(5, D);
            done();
        });
    });

    it('should not execute piped tasks without .execute', function (done) {
        var I = 0;
        queueTask(3).pipe(function (cb) {
            I++;
            cb(D + I);
        });

        setTimeout(function () {
            assert.equal(0, I);
            done();
        }, 100);
    });

    it('should executed only 1 time', function (done) {
        var I = 0;
        queueTask(1).pipe(function (D) {
            return ST(function (cb) {
                I++;
                cb(D + I);
            });
        }).execute(function (D) {
            assert.equal(6, D);
            assert.equal(1, I);
        }).execute(function (D) {
            assert.equal(6, D);
            assert.equal(1, I);
            done();
        });
    });

    describe('subtask.transform', function () {
        it('should transform task result by the function', function (done) {
            queueTask(1)
            .pipe(jobOne)
            .transform(function (R) {
                return R * R;
            }).execute(function (D) {
                assert.equal(100, D);
                done();
            });
        });

        it('should transform first then pipe', function (done) {
            queueTask(1)
            .transform(function (R) {
                return R * R;
            }).pipe(jobOne)
            .execute(function (D) {
                assert.equal(50, D);
                done();
            });
        });
    });
});

describe('subtask.pick', function () {
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
});

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
        getProductByIdTask(0).execute(function (R) {
            assert.equal(undefined, R);
            done();
        });
    });

    it('should works well when id ok', function (done) {
        getProductByIdTask(3).execute(function (R) {
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
            searchProductsTasks('test').pipe(getProductByIdTask, function (R) {
                return R.list[0];
            }).execute(function (D) {
                assert.deepEqual({
                    title: 'this is a mocked product',
                    id: 1
                }, D);
                done();
            });
        });

        it('task: get 3rd searched product, not valid', function (done) {
            searchProductsTasks('test').pipe(getProductByIdTask, function (R) {
                return R.list[2];
            }).execute(function (D) {
                assert.deepEqual(undefined, D);
                done();
            });
        });
    });
});

