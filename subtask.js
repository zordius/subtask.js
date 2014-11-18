/*jslint node: true */
'use strict';

var jpp = require('json-path-processor'),

later = function (func) {
    process.nextTick(func);
},

laterThrow = function (E) {
    later(function () {
        throw E;
    });
},

safeCallback = function (task, data, cb) {
    if ('function' !== (typeof cb[0])) {
        return;
    }
    later(function () {
        try {
            cb[0].apply(task, [data]);
        } catch (E) {
            if (cb[1] && cb[1].apply) {
                cb[1].apply(task, []);
            }
            if (task.throwError) {
                laterThrow(E);
            }
        }
    });
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
                    safeCallback(myself, result, callbacks.shift());
                }
                if (myself.errors.length && myself.throwError) {
                    laterThrow(myself.errors);
                }
            }
        };

    this.errors = [];
    this.throwError = true;
    this.execute = function (cb, cb2) {
        // do nothing when no subtask or input string
        if (!tasks || ('string' === type)) {
            cb(tasks);
            return this;
        }

        // executed, return cached result
        if (executed) {
            safeCallback(this, result, [cb, cb2]);
            return this;
        }

        // wait for result
        callbacks.push([cb, cb2]);

        // started, not again
        if (all) {
            return this;
        }

        // wrap a function
        if ('function' === type) {
            all = 1;
            try {
                tasks.apply(this, [function (D) {
                    result = D;
                    ender();
                }]);
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
                if (tasks[I] instanceof subtask) {
                    runner(I, tasks[I]);
                } else {
                    result[I] = tasks[I];
                }
            }
        }
        // minus one to restore
        all--;

        if (all === 0) {
            callbacks.pop()[0].apply(this, [tasks]);
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

SUBTASK.before = function (taskCreator, doFunc, This) {
    return function () {
        var result = doFunc.apply(This || this, [taskCreator, arguments]);

        if (result instanceof subtask) {
            return result;
        }

        if (result) {
            return SUBTASK(result);
        }

        return taskCreator.apply(This || this, arguments) || SUBTASK();
    };
};

SUBTASK.after = function (taskCreator, doFunc, This) {
    return function () {
        var task = taskCreator.apply(This || this, arguments) || SUBTASK();
        return doFunc.apply(This || this, [task, arguments]) || task;
    };
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

        return task ? SUBTASK(function (cb) {
            T.execute(function (D) {
                var nextTask = task(D);

                T.track(nextTask);
                nextTask.execute(function (R) {
                    cb(R);
                }, cb);
            });
        }).track(T) : this;
    },
    transform: function (func) {
        var T = this;

        return SUBTASK(function (cb) {
            T.execute(function (D) {
                cb(func.apply(T, [D]));
            }, cb);
        }).track(T);
    },
    pick: function (path) {
        var T = this;

        return SUBTASK(function (cb) {
            T.execute(function (D) {
                cb(jpp(D, path));
            }, cb);
        }).track(T);
    },
    error: function (E) {
        this.errors.push((E instanceof Error) ? E : new Error(E));
        return this;
    }
};

module.exports = SUBTASK;
