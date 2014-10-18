/*jslint node: true */
'use strict';

var jpp = require('json-path-processor'),
    cache = require('simple-lru-cache'),
    taskpool = null,

later = function (func, I) {
    setTimeout(function () {
        func(I);
    }, 1);
},

safelater = function (func, I) {
    if ('function' === (typeof func)) {
        later(func, I);
    }
},

subtask = function (tasks) {
    var executed = false,
        type = (typeof tasks),
        count = 0,
        all = 0,
        result = {},
        callbacks = [],
        runner = function (index, task) {
            try {
                task.execute(function (D) {
                    result[index] = D;
                    ender();
                });
            } catch (E) {
                later(function () {
                    result[index] = ('function' === (typeof task)) ? undefined : task;
                    ender();
                });
            }
        },
        ender = function () {
            count++;
            if (count === all) {
                executed = true;
                while (callbacks.length) {
                    safelater(callbacks.pop(), result);
                }
            }
        };

    this.execute = function (cb) {
        // do nothing when no subtask or input string
        if (!tasks || ('string' === type)) {
            cb(tasks);
            return this;
        }

        // executed, return cached result
        if (executed) {
            cb(result);
            return this;
        }

        // wrap a function
        if ('function' === type) {
            tasks(function (D) {
                result = D;
                executed = true;
                cb(result);
            });
            return this;
        }

        // wait for result
        callbacks.push(cb);

        // started, not again
        if (all) {
            return this;
        }

        // execute
        for (var I in tasks) {
            all++;
            runner(I, tasks[I]);
        }

        if (all === 0) {
            callbacks.pop()(tasks);
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

SUBTASK.cache = function (tasks, key) {
    var T;

    if (!taskpool) {
        return SUBTASK(tasks);
    }

    T = taskpool.get(key);

    if (T) {
        return T;
    }

    T = SUBTASK(tasks);
    T.taskKey = key;
    taskpool.set(key, T);
    return T;
};

subtask.prototype = {
    pipe: function (task) {
        var T = this;

        return SUBTASK(function (cb) {
            T.execute(function (D) {
                task(D).execute(function (R) {
                    cb(R);
                });
            });
        });
    },
    transform: function (func) {
        var T = this;

        return SUBTASK(function (cb) {
            T.execute(function (D) {
                cb(func(D));
            });
        });
    },
    pick: function (path) {
        var T = this;

        return SUBTASK(function (cb) {
            T.execute(function (D) {
                cb(jpp(D, path));
            });
        });
    }
};

module.exports = SUBTASK;
