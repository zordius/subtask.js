/*jslint node: true */
'use strict';

var subtask = function (tasks) {
    var executed = false,
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
        ender = function () {
            count++;
            if (count == all) {
                while (callbacks.length) {
                    later(callbacks.pop(), result);
                }
            }
        },
        later = function (F, I) {
            setTimeout(function () {
                F(I);
            }, 1);
        };

    this.execute = function (cb) {
        // do nothing when no subtask or input string
        if (!tasks || ('string' == (typeof tasks))) {
            cb(tasks);
            return;
        }

        // executed, return cached result
        if (executed) {
            cb(result);
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


module.exports = subtask;
