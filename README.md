subtask.js
==========

A JavaScript class and design pattern to make async tasks clear and simple.

[![Dependency Status](https://david-dm.org/zordius/subtask.js.png)](https://david-dm.org/zordius/subtask.js)  [![Build Status](https://travis-ci.org/zordius/subtask.js.svg?branch=master)](https://travis-ci.org/zordius/subtask.js)

Features
--------

* execute all child tasks in parallel
* exception safe
* cached the result naturally
* singleton (todo)

How to Use
----------

**Define task**

```javascript
var task = require('subtask'),

// This is a sync task
multiply = function (a, b) {
    return task(a * b);
};

// This is an async task
plus = function (a, b) {
    return task(function (cb) {
        mathApi.plus(a, b, function (value) {
            cb(value);
        });
    });
};
```

**Execute task**

Same async interface for all tasks.

```javascript
multiply(3, 5).execute(function (R) {
    console.log('3 * 5 = ' + R);
});

plus(4, 6).execute(function (R) {
    console.log('4 + 6 = ' + R);
});
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

But, how do we get the data? by the query param? We decide to make modules handle itself.

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

**Everything should be async**

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

**Parellel is better**

For performance, manybe we can get modules in parallel? For this we should change the interfaces of modules a bit, make then return a function.

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

Maybe the getStoryModule wanna set cookie? So we should send req to all modules...

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

Stop adding input param, we use one object to handle all requirements.

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

Hmmm...in most case, the title is story title. Do it....

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

Stop! R[0] to R[n] are bad! And, why we get the story two times? (one for the page title, another one for the story module) . Maybe we should reuse the fetched data and store it.

**Namespace**

We can store data in the context `CX`, and define good namespace rule. And we make a framework to handle modules and page. Now the code seens better:

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

* CX.data.stories: a list of stories. good for all pages.
* CX.data.user.name: user name. good for all pages.
* CX.module.story: story module....what happened when I put 2 story modules in 1 page?!!!

We do not believe all developers in the team remember all naming rules.

**Make it local**

Stop using namespace, it is a 'global variable' solution under `CX`. We should use local variable.

```javascript
framework.defindPage('somePage', function (CX) {
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

<a "https://github.com/zordius/subtask.js">subtask</a> is created for this coding style.
