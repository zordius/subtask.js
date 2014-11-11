'use strict';

var assert = require('chai').assert,
    ST = require('../subtask.js'),
    itNotIncludeNode8 = function (desc, cb) {
        (process.version.match(/^v0.8/) ? it.skip : it)(desc, cb);
    };

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

describe('subtask.transform', function () {
    it('should change results', function (done) {
        ST({a:1, b:2}).transform(function (R) {
            R.c = R.a + R.b;
            return R;
        }).execute(function (D) {
            assert.deepEqual({a:1, b:2, c:3}, D);
            done();
        });
    });

    it('should work well after .execute()', function (done) {
        ST({a:1, b:2}).execute(function (RR) {
            // nothing...
        }).transform(function (R) {
            R.c = R.a + R.b;
            return R;
        }).execute(function (D) {
            assert.deepEqual({a:1, b:2, c:3}, D);
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
            searchProductsTasks('test')
            .pick('list.0')
            .pipe(getProductByIdTask)
            .execute(function (D) {
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
            .pipe(getProductByIdTask)
            .execute(function (D) {
                assert.deepEqual(undefined, D);
                done();
            });
        });
    });
});

describe('subtask error handling', function () {
    it('should nothing bad when task created', function (done) {
        var badTask = function (id) {
            return ST(function (cb) {
                cb(id.a.b.c);
            });
        };
        done();
    });

    itNotIncludeNode8('should handle exception inside task when .execute()', function (done) {
        var domain = require('domain').create();

        domain.on('error', function (err) {
            // after task done, still throw original exception
            done();
        });

        domain.run(function () {
            var badTask = function (id) {
                return ST(function (cb) {
                    cb(id.a.b.c);
                });
            };

            badTask(123).execute(function (D) {
                assert.equal(undefined, D);
            });
        });
    });

    itNotIncludeNode8('should handle exception inside .transform', function (done) {
        var domain = require('domain').create(),
            exec = 0;

        domain.on('error', function (err) {
            // after task done, still throw original exception
            assert.equal(2, exec);
            done();
        });

        domain.run(function () {
            ST().transform(function (R) {
                exec++;
                return R.ok;
            }).execute(function (D) {
                exec++;
                assert.equal(undefined, D);
            });
        });
    });

    it('should handle exception inside children tasks', function (done) {
        var domain = require('domain').create(),
            exec = 0;

        domain.on('error', function (err) {
            // after task done, still throw original exception
            assert.equal(2, exec);
            done();
        });

        domain.run(function () {
            ST({
                a: 1,
                b: ST(2),
                c: ST(3).transform(function (R) {return R * 2;}),
                d: ST().transform(function (R) {return R.a.b;})
            }).transform(function (R) {
                exec++;
                assert.deepEqual({
                    a: 1,
                    b: 2,
                    c: 6,
                    d: undefined
                }, R);
                return R.c;
            }).execute(function (D) {
                exec++;
                assert.equal(6, D);
            });
        });
    });
});
