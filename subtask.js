/*jslint node: true */
'use strict';

var subtask = function (tasks) {
    var executed = false,
        type = (typeof tasks),
        count = 0,
        all = 0,
        result = {},
        callbacks = [],
        I,
        runner = function (index, task) {
            try {
                task.execute(function (D) {
                    result[index] = D;
                    ender();
                });
            } catch (E) {
                later(function () {
                    result[index] = ('function' == (typeof task)) ? undefined : task;
                    ender();
                });
            }
        },
        later = function (F, I) {
            setTimeout(function () {
                F(I);
            }, 1);
        },
        ender = function () {
            count++;
            if (count == all) {
                executed = true;
                while (callbacks.length) {
                    later(callbacks.pop(), result);
                }
            }
        };

    this.execute = function (cb) {
        // do nothing when no subtask or input string
        if (!tasks || ('string' == type)) {
            cb(tasks);
            return;
        }

        // executed, return cached result
        if (executed) {
            cb(result);
            return;
        }

        // wrap a function
        if ('function' == type) {
            tasks(function (D) {
                result = D;
                cb(result);
            });
            return;
        }

        // wait for result
        callbacks.push(cb);

        // started, not again
        if (all) {
            return;
        }

        // execute
        for (I in tasks) {
            all++;
            runner(I, tasks[I]);
        }

        if (all == 0) {
            callbacks.pop()(tasks);
        }
    }
}


module.exports = function(tasks) {
    return new subtask(tasks);
};
