'use strict';

var assert = require('chai').assert,
    ST = require('../subtask.js'),
    itNotIncludeNode8 = function (desc, cb) {
        (process.version.match(/^v0.8/) ? it.skip : it)(desc, cb);
    };

describe('subtask error handling', function () {
    it('should nothing bad when task created', function (done) {
        var badTask = function (id) {
            return ST(function (resolve) {
                resolve(id.a.b.c);
            });
        };
        done();
    });

    it('should handle exception inside task', function (done) {
        var badTask = function (id) {
            return ST(function (cb) {
                cb(id.a.b.c);
            });
        };

        badTask(123).then(function (D) {
            assert.equal(undefined, D);
        }, function (F) {
            assert.equal(true, F instanceof Error);
            done();
        });
    });

    it('should handle exception inside .then()', function (done) {
        var exec = 0;

        ST().then(function (R) {
            exec++;
            return R.ok;
        }).then(function (R) {
            exec++;
        }, function (E) {
            error++;
        }).then(null, function (E) {
            assert.equal(2, exec);
            assert.equal(true, F instanceof Error);
            done();
        });
    });

    itNotIncludeNode8('should handle exception inside .execute()', function (done) {
        var domain = require('domain').create(),
            exec = 0;

        domain.on('error', function (err) {
            // after task done, still throw original exception
            assert.equal(2, exec);
            domain.dispose();
            done();
        });

        domain.run(function () {
            ST().transform(function (R) {
                exec++;
            }).execute(function (D) {
                exec++;
                // do nothing...
            }).execute(function (D) {
                // error here
                D.a = D.b;
            });
        });
    });

    itNotIncludeNode8('should throw exception once', function (done) {
        var domain = require('domain').create(),
            exec = 0,
            err = 0;

        domain.on('error', function () {
            err++;
        });

        domain.run(function () {
            ST().transform(function (R) {
                exec++;
                return R.ok;
            }).execute(function (D) {
                exec++;
                assert.equal(undefined, D);
            }).execute(function (D) {
                exec++;
                assert.equal(undefined, D);
            }).execute(function (D) {
                exec++;
                assert.equal(undefined, D);
            });
        });

        setTimeout(function () {
            domain.dispose();
            assert.equal(4, exec);
            assert.equal(1, err);
            done();
        }, 200);
    });

    itNotIncludeNode8('should throw exception once', function (done) {
        var domain = require('domain').create(),
            exec = 0,
            err = 0;

        domain.on('error', function () {
            err++;
        });

        domain.run(function () {
            ST().transform(function (R) {
                exec++;
                return R.ok;
            }).execute(function (D) {
                exec++;
                assert.equal(undefined, D);
            }).execute(function (D) {
                exec++;
                assert.equal(undefined, D);
            }).execute(function (D) {
                exec++;
                assert.equal(undefined, D);
            });
        });

        setTimeout(function () {
            domain.dispose();
            assert.equal(4, exec);
            assert.equal(1, err);
            done();
        }, 200);
    });

    it('should no exception when .quiet() called', function (done) {
        var exec = 0;

        ST().transform(function (R) {
            exec++;
            return R.ok;
        }).quiet().execute(function (D) {
            exec++;
            D.a = D.b;
        }).execute(function (D) {
            exec++;
            D.c = D.d;
        }).execute(function (D) {
            exec++;
            D.e = D.f;
        }).transform(function (D) {
            exec++;
            return D.k;
        }).execute(function (R) {
            exec++;
        });

        setTimeout(function () {
            assert.equal(6, exec);
            done();
        }, 200);
    });

    it('should no exception when .quiet() after .pipe() or .transform()', function (done) {
        var exec = 0,
            badTask = function () {
                return ST(function () {
                    return arguments[2].ok;
                });
            };

        ST().transform(function (R) {
            exec++;
            return R.ok;
        }).pipe(badTask).transform(function (D) {
            exec++;
            return;// D.bad;
        }).quiet().execute(function (O) {
            assert.equal(2, exec);
            done();
        });
    });

    it('should continue to the end when pipe into a bad transformed async task', function (done) {
        var exec = 0;

        ST(function (cb) {
           exec++;
           setTimeout(function () {
               cb('OK');
           }, 100);
        }).pipe(function (D) {
           exec++;
           assert.equal('OK', D);
           return ST(function (cb) {
               setTimeout(function () {
                   cb('YES');
               }, 100);
           }).transform(function (O) {
               assert.equal('YES', O);
               exec++;
               D.a.b = O;
               exec++;
               cb('what?');
           });
        }).execute(function (R) {
           assert.equal(3, exec);
           done();
        });
    });
});
