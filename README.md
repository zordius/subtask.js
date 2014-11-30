subtask.js
==========

An extended promise.

[![npm version](https://img.shields.io/npm/v/subtask.svg)](https://www.npmjs.org/package/subtask) [![Dependency Status](https://david-dm.org/zordius/subtask.js.png)](https://david-dm.org/zordius/subtask.js)  [![Build Status](https://travis-ci.org/zordius/subtask.js.svg?branch=master)](https://travis-ci.org/zordius/subtask.js) [![Test Coverage](https://codeclimate.com/github/zordius/subtask.js/badges/coverage.svg)](https://codeclimate.com/github/zordius/subtask.js) [![Code Climate](https://codeclimate.com/github/zordius/subtask.js/badges/gpa.svg)](https://codeclimate.com/github/zordius/subtask.js) [![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE.txt)

Features
--------

* .pick(path) to pick required data safely
* create promise with object and executed with key/value

** Now subtask.js is built on top of promise and changed a lot from old version. If you wanna check old API, please check <a href="https://github.com/zordius/subtask.js/tree/none_promise_subtask">another branch</a>.

How to Use
----------

**Define task**

* A task is created by `task creator` function; the function will take your input parameters then return the created task instance (also a promise).

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
    return task(function (resolve) {
        mathApi.plus(a, b, function (value) {
            resolve(value);
        });
    });
};
```

**Execute task**

* Use `.then()` promise api.

```javascript
multiply(3, 5).then(function (R) {
    console.log('3 * 5 = ' + R);
});

plus(4, 6).then(function (R) {
    console.log('4 + 6 = ' + R);
});

var P35 = plus(3, 5);

P35.then(function (R) {
    console.log('3 * 5 = ' + R);
});

P35.then(function (R) {
    console.log('3 * 5 still = ' + R + ', mathApi.plus only be executed once');
});
```

**Parallel subtasks**

* Use object or array to define subtasks.
* `task.then()` will trigger all subtasks.then() in parallel.
* Results of all subtasks .then() will be collected back.

```javascript
var mathLogic = function (a, b) {
    return task({
        multiply: multiply(a, b),
        plus: puls(a, b),
        minus: minus(a, b)
    });
});

mathLogic(9, 8).then(function (R) {
    // R will be {multiply: 72, plus: 17, minus: 1}
});
```

**Pipe the tasks**

* Use the result of previous task as input of next task creator

```javascript
var taskQueue = function (input) {
    return firstTask(input).then(secondTask).then(thirdTask);
});
```

**Transform results**

* Use .pick('path.to.value') to pick wanted value

```javascript
// when get the title of first story
// Same with task2(456).then(function (R) {return R.story[0].title});
task2(456).pick('story.0.title');
```

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
