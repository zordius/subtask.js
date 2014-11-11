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
            task.quiet().execute(function (D) {
                result[index] = D;
                ender();
            });
        },
        ender = function () {
            count++;
            if (count === all) {
                executed = true;
                while (callbacks.length) {
                    safelater(callbacks.pop(), result);
                }
                if (myself.errors.length && !myself.silent) {
                    later(function () {
                        throw myself.errors[0];
                    });
                }
            }
        };

    this.errors = [];
    this.silent = false;
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

        // execute
        for (var I in tasks) {
            if (tasks.hasOwnProperty(I)) {
                if (SUBTASK.isSubtask(tasks[I])) {
                    runner(I, tasks[I]);
                } else {
                    result[I] = tasks[I];
                }
            }
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
        this.silent = true;
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
        });
    },
    transform: function (func) {
        var T = this,
            newTask = SUBTASK(function (cb) {
                T.quiet().execute(function (D) {
                    cb(func(D));
                });
            });
        return newTask;
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
