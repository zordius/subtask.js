/*jslint node: true */
'use strict';

var jpp = require('json-path-processor'),
    cache = require('simple-lru-cache'),
    taskpool = null,

later = function (func, I) {
    process.nextTick(function () {
        func(I);
    });
},

safelater = function (func, I) {
    if ('function' === (typeof func)) {
        later(func, I);
    }
},

subtask = function (tasks) {
    var myself = this,
        executed = false,
        type = (typeof tasks),
        count = 0,
        all = 0,
        result = {},
        callbacks = [],
        runner = function (index, task) {
            all++;
            task.errors = myself.errors;
            task.quiet().execute(function (D) {
                result[index] = D;
                ender();
            });
        },
        ender = function (noPlus) {
            count = count + (noPlus ? 0 : 1);
            if (count === all) {
                executed = true;
                while (callbacks.length) {
                    safelater(callbacks.pop(), result);
                }
                if (myself.errors.length && myself.throwError) {
                    later(function () {
                        throw myself.errors;
                    });
                }
            }
        };

    this.errors = [];
    this.throwError = true;
    this.execute = function (cb) {
        // do nothing when no subtask or input string
        if (!tasks || ('string' === type)) {
            cb(tasks);
            return this;
        }

        // executed, return cached result
        if (executed) {
            try {
                cb.apply(myself, [result]);
            } catch (E) {
                if (myself.throwError) {
                    later(function () {
                        throw E;
                    });
                }
            }
            return this;
        }

        // wait for result
        callbacks.push(cb);

        // started, not again
        if (all) {
            return this;
        }

        // wrap a function
        if ('function' === type) {
            all = 1;
            try {
                tasks(function (D) {
                    result = D;
                    ender();
                });
            } catch (E) {
                this.errors.push(E);
                result = undefined;
                ender();
            }
            return this;
        }

        // plus one to prevent end check passed in loop
        all++;
        // wrap a hash and execute subtasks
        for (var I in tasks) {
            if (tasks.hasOwnProperty(I)) {
                if (SUBTASK.isSubtask(tasks[I])) {
                    runner(I, tasks[I]);
                } else {
                    result[I] = tasks[I];
                }
            }
        }
        // minus one to restore
        all--;

        if (all === 0) {
            callbacks.pop()(tasks);
        } else {
            ender(true);
        }

        return this;
    };
},

SUBTASK = function(tasks) {
    return new subtask(tasks);
};

SUBTASK.isSubtask = function (O) {
    return O instanceof subtask;
};

SUBTASK.initCache = function (size) {
    if (taskpool) {
        taskpool.reset();
    }
    taskpool = new cache({maxSize: size});
};

SUBTASK.cache = function (tasks, key, timeout) {
    var T,
        thisPool = (this && this.taskPool) ? this.taskPool : false,
        thisKey = ((this && this.taskKey) ? this.taskKey : '') + key,
        now;

    if (timeout) {
        now = (new Date()).getTime();
    }

    if (thisPool && thisPool[thisKey]) {
        T = thisPool[thisKey];
    }

    if (taskpool) {
        T = taskpool.get(thisKey);
    }

    if (timeout && T && ((T.taskTime + timeout) < now)) {
        T = undefined;
    }

    if (!T) {
        T = SUBTASK(tasks);
    }

    if (thisPool) {
        thisPool[thisKey] = T;
    }

    if (taskpool) {
        taskpool.set(thisKey, T);
    }

    T.taskKey = thisKey;
    T.taskTime = now;

    return T;
};

subtask.prototype = {
    quiet: function () {
        this.throwError = false;
        return this;
    },
    track: function (task) {
        this.errors = task.errors;
        this.throwError = task.throwError;
        task.throwError = false;
        return this;
    },
    pipe: function (task) {
        var T = this;

        return SUBTASK(function (cb) {
            T.execute(function (D) {
                task(D).execute(function (R) {
                    cb(R);
                });
            });
        }).track(T);
    },
    transform: function (func) {
        var T = this;

        return SUBTASK(function (cb) {
            T.execute(function () {
                cb(func.apply(T, arguments));
            });
        }).track(T);
    },
    pick: function (path) {
        var T = this;

        return SUBTASK(function (cb) {
            T.execute(function (D) {
                cb(jpp(D, path));
            });
        }).track(T);
    }
};

module.exports = SUBTASK;
