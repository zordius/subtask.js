subtask.js
==========

A JavaScript class and design pattern to make async tasks clear and simple.

[![npm version](https://img.shields.io/npm/v/subtask.svg)](https://www.npmjs.org/package/subtask) [![Dependency Status](https://david-dm.org/zordius/subtask.js.png)](https://david-dm.org/zordius/subtask.js)  [![Build Status](https://travis-ci.org/zordius/subtask.js.svg?branch=master)](https://travis-ci.org/zordius/subtask.js) [![Test Coverage](https://codeclimate.com/github/zordius/subtask.js/badges/coverage.svg)](https://codeclimate.com/github/zordius/subtask.js) [![Code Climate](https://codeclimate.com/github/zordius/subtask.js/badges/gpa.svg)](https://codeclimate.com/github/zordius/subtask.js) [![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE.txt)

Features
--------

* Execute all child tasks in parallel.
* Execute tasks sequentially, pipe previous output into next task.
* Exception safe, auto delay exceptions after tasks done.
* Cache the result naturally.

**Why not...**

* Why not `async.series()`? Because we need to handle task output as another task input, it make callback functions access variables in another scope and mess up everything.
* Why not `async.parallel()`? Because we like to put results with semantic naming under an object.
* Why not extend `async.*`? Because we like all tasks can be defined and be executed in the same way... we need something like promise to ensure the interface is normalized.
* Why not promise? Because we want to handle all success + failed cases in same place, `promise.then()` takes 2 callbacks.
* Why not extends `promise`? Because the requirement is different, and we do not want to confuse developers.

How to Use
----------

**Define task**

* A task is created by `task creator` function; the function will take your input parameters then return the created task instance.
* After the task is created, the final result should be always same because the input parameters were already put into the task.
* Therefore, the logic inside a task will be executed only once and the result is kept by subtask.

```javascript
var task = require('subtask'),

// multiply is a task creator to do sync jobs
// multiply(1, 2) is a created task instance
multiply = function (a, b) {
    return task(a * b);
},

// plus is a task creator to do async jobs
// plus(3, 4) is a created task instance
plus = function (a, b) {
    return task(function (cb) {
        mathApi.plus(a, b, function (value) {
            cb(value);
        });
    });
};
```

**Execute task**

* When you run `.execute()` the first time, subtask will run the inner logic inside the task.
* When you run `.execute()` many times, subtask will return the result of first execution.
* If the task is async, all `.execute()` will wait for first result. Subtask will ensure the inner logic is be executed only once.

```javascript
multiply(3, 5).execute(function (R) {
    console.log('3 * 5 = ' + R);
});

plus(4, 6).execute(function (R) {
    console.log('4 + 6 = ' + R);
});

plus(3, 5).execute(function (R) {
    console.log('3 * 5 = ' + R);
}).execute(function (R) {
    console.log('3 * 5 still = ' + R + ', mathApi.plus only be executed once');
});
```

**Parallel subtasks**

* Use hash to define subtasks.
* `task.execute()` will trigger all subtasks.execute() in parallel.
* After all subtasks .execute() done , callback of `task.execute()` will be triggered.
* Results of all subtasks .execute() will be collected into the hash.

```javascript
var mathLogic = function (a, b) {
    return task({
        multiply: multiply(a, b),
        plus: puls(a, b),
        minus: minus(a, b)
    });
});

mathLogic(9, 8).execute(function (R) {
    // R will be {multiply: 72, plus: 17, minus: 1}
});
```

**Pipe the tasks**

* Use the result of previous task as input of next task creator

```javascript
var taskQueue = function (input) {
    return firstTask(input).pipe(secondTask).pipe(thirdTask);
});

taskQueue(123).execute(function (D) {
    // get result1 from firstTask(123).execute()
    // then get result2 from secondTask(result1).execute()
    // then get D from thirdTask(result2).execute()
});
```

**Transform then pipe**

* Use .transform() to change the task result or pick wanted value
* Use .pick('path.to.value') to pick wanted value

```javascript
task1(123)
.transform(function (R) {
    return R * 2;
})
.pipe(task2)   // take result * 2 of task1 , send into task2 as input
.pipe(task3)   // take result of task2 , send into task3
.execute(function (D) {
    // now D is result of task3
});

// when .execute() we get the title of first story
// Same with task2(456).transform(function (R) {return R.story[0].title});
task2(456).pick('story.0.title');
```

**Modify Task Creator**

* use subtask.after() to get a new task creator which updates the created task

```javascript
// getProduct is a task creator to call product api
var getProduct = function (id) {
   return subtask(function (cb) {
       if (!id) { // input validation
           return cb();
       }
       request(apiUrl + id, function (err, res, body) {
           cb(body);
       });
   });
};

// renderProduct is a task creator for getProduct + .pipe(renderTask)
var renderProduct = subtask.after(getProduct, function (task) {
   return task.pipe(renderTask);
});
```

* use subtask.before() to do extra logic before you create the task

```javascript
// An example to apply cache logic on task creator
var cachedGetProduct = subtask.before(getProduct, function (task, args) {
    var T = cache.get(args[0]);

    // not in cache...create and store.
    if (!T) {
        T = task.apply(this, args);
        cache.set(id, T);
    }

    return T;
});
```

**Error handling**

* Error in an async task will be auto delayed.
* Error in a `.execute()` callback will be delayed.
* Error in a `.transform()` callback will be delayed.
* All delayed error will be throw later, only once.
* If you pipe/transform/parallel execute tasks, all delayed error will be tracked by final/parent task.
* To silently ignore these error, use .quiet()

```javascript
var errorTask = subtask({
   good: 'OK!',
   correct: subtask('Yes'),
   badCallback: subtask().transform(function (D) {return D.a.b})
                                    // TypeError: Cannot read property 'a' of undefined
});

errorTask.execute(function (R) {
   // you will get {good: 'OK!', correct: 'Yes', badCallback: undefined} here
   // after this function, the delayed exception will be throw once
}).execute(function (R) {
   R.a.b.c = 10; // Error in .execute() callback will be delayed
}).execute(function (R) {
   // This callback function still works!
   // the previous exceptions will be throw later.
});

// Use task.quiet() or task.throwError = false to stop all exception.
anotherErrorTask.quiet().execute(function (R) {
   // still safe, and now exception will not be throw
   // access stored exception from this.errors
});
```

**Good Practices**

* Return `undefined` means error in a task.
* Use `this.error(yourException)` to throw delayed exception for specific error information

```javascript
myTaskCreator = function () {
    return subtask(function (cb) {
        var thisTask = this;
        doSomeAsyncApiCall(function (err, D) {
            // error handling
            if (err) {
                thisTask.error(err);
                return cb();
            }
            // .... all others....
            cb(result);
        });
    });
};
```

* Check input and output in your task creator.
* Create an empty task when input error.

```javascript
myTaskCreator = function (a) {
    // input validation
    if (isNotValid(a)) {
        return subtask();
    }

    // .... all others....
    return subtask(....);
};
```

* Do not `.quite()` in your subtask modules.
* Use `.quite()` as late as you can.

The Long Story
--------------

**Serve a page**

With <a href="http://expressjs.com/">Express</a>, we do this:

```javascript
app.get('/', function (req, res) {
   res.send('The page content...');
});
```

**Modulize the page**

We can make the page standalone, then we can mount the page to anywhere.

```javascript
// The page
var somePage = function (req, res) {
    res.send('The page content...');
});


// Mount it
app.get('/some/where', somePage);
```

**Modules in the page**

We always do this for a page, right?

```javascript
var somePage = function (req, res) {
    var header = getHeaderModule(),
        body = getStoryModule() + getRelatedStoryModule(),
        footer = getFooterModule();

    res.send(TemplateEngine(header, body, footer));
});
```

**We should provide input for modules**

But, how do we get the data? By the query parameters? We decide to make modules handle itself.

```javascript
var somePage = function (req, res) {
    var header = getHeaderModule(req),
        body = getStoryModule(req) + getRelatedStoryModule(req),
        footer = getFooterModule(req);

    res.send(TemplateEngine(header, body, footer));
});

var someModule = function (req) {
    var id = req.params.id || defaultId,
        page = getPage(req),
        ....
});
```

* ISSUE 1: many small pieces of code do similar tasks for input.
* ISSUE 2: the real life of a page is async.

**Everything should be Async**

Yes, it's our real life.

```javascript
var somePage = function (req, res) {
    getHeaderModule(req, function(header) {
        getStoryModule(req, function(body) {
            getFooterModule(req, function(footer) {
               res.send(TemplateEngine(header, body, footer));
            });
        });
    });
});
```

We can use <a href="https://www.google.com/search?q=javascript+promise">promise</a> to prevent callback hell.

**Parallel is better**

For performance, maybe we can get modules in parallel? For this we should change the interfaces of modules a bit, make then return a function.

```javascript
var somePage = function (req, res) {
    async.parallel([
        getHeaderModule(req),
        getStoryModule(req),
        getFooterModule(req)
    ], function (R) {
        res.send(TemplateEngine(R[0], R[1], R[2]));
    });
```

**Take care of Response**

Maybe the `getStoryModule` wanna set cookie? So we should send `req` to all modules...

```javascript
var somePage = function (req, res) {
    async.parallel([
        getHeaderModule(req, res),
        getStoryModule(req, res),
        getFooterModule(req, res)
    ], function (R) {
        res.send(TemplateEngine(R[0], R[1], R[2]));
    });
```

**Use one Object**

Stop appending input parameters, we use one object to handle all requirements.

```javascript
var somePage = function (req, res) {
    var CX = {
        req: req,
        res: res
    };

    async.parallel([
        getHeaderModule(CX),
        getStoryModule(CX),
        getFooterModule(CX)
    ], function (R) {
        res.send(TemplateEngine(R[0], R[1], R[2]));
    });
```

**How about Title?**

Hmmm...In most case, the title is story title. Do it....

```javascript
var somePage = function (CX) {
    async.parallel([
        getStoryTitle(CX),
        getHeaderModule(CX),
        getStoryModule(CX),
        getFooterModule(CX)
    ], function (R) {
        res.send(TemplateEngine(R[0], R[1], R[2], R[3]));
    });
```

Stop! `R[0]` to `R[n]` are bad! And, why we get the story two times? (one for the page title, another one for the story module) . Maybe we should reuse the fetched data and store it.

**Namespace**

We can store data in the context `CX`, and define good namespace rule. And we make a framework to handle modules and page. Now the code seems better:

```javascript
framework.defindPage('somePage', function (CX) {
    CX.getData('storyTitle').then(function () {
        CX.getModule(CX, ['header', 'story', 'footer']).then(function () {
            CX.render('someTemplate', {
                title: CX.data.story.title,
                header: CX.module.header,
                body: CX.module.story,
                footer: CX.module.footer
            });
        });
    });
});
```

Namespace rule is hard to maintain:

* CX.data.stories: a list of stories. Good for all pages.
* CX.data.user.name: user name. Good for all pages.
* CX.module.story: story module...What happened when I put 2 story modules in 1 page?!!!

We do not believe all developers in the team remember all naming rules.

**Make it local**

Stop using namespace, it is a 'global variable' solution under `CX`. We should use local variable.

```javascript
framework.definePage('somePage', function (CX) {
    CX.executeJobs({
        title: CX.getData('storyTitle'),
        header: CX.getModule('header'),
        body: CX.getModule('story'),
        footer: CX.getModule('footer')
    }, function (data) {
       CX.render('someTemplate', data);
    });
});
```

<a href="https://github.com/zordius/subtask.js">subtask</a> is created for this coding style.
