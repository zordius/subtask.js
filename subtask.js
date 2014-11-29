/*jslint node: true */
'use strict';

var jpp = require('json-path-processor'),
    promise = require('promise'),

promise_all = function (tasks) {
    var values = [],
        keys = [],
        I,
        all = 0;

    for (I in tasks) {
        if (tasks.hasOwnProperty(I)) {
            all++;
            values.push(tasks[I]);
            keys.push(I);
        }
    }

    return promise.all(values).then(function (V) {
        var ret = {};

        for (I=0;I<all;I++) {
            ret[keys[I]] = V[I];
        }

        return ret;
    });
},

subtask = function (tasks) {
    var typeOf = typeof tasks,
        P;

    switch (typeOf) {
    case 'object':
        P = promise_all(tasks);
        break;
    case 'function':
    case 'array':
        P = new promise(tasks);
        break;
    default:
        P = promise.resolve(tasks);
    }
    this.then = P.then;
},

SUBTASK = function(tasks) {
    return new subtask(tasks);
};

subtask.prototype.pick = function (path) {
    return this.then(function (O) {
        return jpp(O, path);
    });
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

module.exports = SUBTASK;
