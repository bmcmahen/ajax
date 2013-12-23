# mio-ajax

[![Build Status](https://secure.travis-ci.org/alexmingoia/mio-ajax.png?branch=master)](http://travis-ci.org/alexmingoia/mio-ajax)
[![Coverage Status](https://coveralls.io/repos/alexmingoia/mio-ajax/badge.png?branch=master)](https://coveralls.io/r/alexmingoia/mio-ajax?branch=master)
[![Bower version](https://badge.fury.io/bo/mio-ajax.png)](http://badge.fury.io/bo/mio-ajax)
[![NPM version](https://badge.fury.io/js/mio-ajax.png)](http://badge.fury.io/js/mio-ajax)
[![Dependency Status](https://david-dm.org/alexmingoia/mio-ajax.png)](http://david-dm.org/alexmingoia/mio-ajax)

Provides an AJAX storage plugin for [Mio](https://github.com/mio/mio).

## Installation

Using [component](https://github.com/component/component/):

```sh
component install mio/mio-ajax
```

Using [bower](http://bower.io/):

```sh
bower install mio-ajax
```

## Usage

```javascript
var mio  = require('mio'),
    ajaxSync = require('mio-ajax');

var User = mio.createModel('User')
  .attr('id', { primary: true })
  .attr('username')
  .use('browser', 'mio-ajax', 'http://api.example.com/users');
```

The example above would expect the following API:

    GET      /users       // Return a JSON list of all users.
    POST     /users       // Creates a new user. Returns JSON of that user.
    DELETE   /users       // Destroys all users.
    GET      /users/id    // Return a JSON user object.
    PUT      /users/id    // Updates existing user. Returns JSON of that user.
    DELETE   /users/id    // Destroys user.

## Defining Alternative Routes

You can specify alternative routes by passing in a second optional argument to
`mio-ajax`.

The default urls look like:

```javascript
var urlMap = {
  index:   '',
  count:   '/count',
  create:  '',
  show:    '/:primary',
  update:  '/:primary'
  destroy: '/:primary',
};
```

Override them if needed:

```javascript
User.use('browser', 'mio-ajax', '/people', {
  show:    '/:username',
  update:  '/:username',
  destroy: '/:username'
});
```

This would make it so that the following routes were used:

    SHOW    ->  GET /people/:username
    UPDATE  ->  PUT /people/:username
    DESTROY ->  DEL /people/:username

### Retrying requests

You can use the `retry` function passed to the `ajax error` event to retry
requests.

```javascript
User.on('ajax error', function(err, retry) {
  if (err.status == 401) {
    refreshAccessToken(function(token) {
      setToken(token);
      retry();
    });
  }
});
```

### Events

#### ajax request

Emitted before XHR request is sent.

```javascript
User.on('ajax request', function(req) {
  // req is superagent request object
  req.set('Authorization', 'Bearer 13a9-34b3-a8da-c78d');
});
```

#### ajax response

Emitted after the XHR request is complete.

```javascript
User.on('ajax response', function(res) {
  var users = res.body.results;
  // Convert JSON string dates into actual dates
  users.forEach(u) {
     u.registeredAt = new Date(u.registeredAt);
  }
  res.body = users;
});
```

#### ajax error

Emitted on XHR error and 4xx or 5xx responses, with an `Error` as the first
argument and a `retry` function as the second argument.

If executed, the retry function will retry the request and execute the
original callback once the request is complete. If a new callback is supplied to
`retry()` then that will be used when the retried request completes.

```javascript
User.on('ajax error', function(err, retry) {
  if (err.status == 401) {
    refreshAccessToken(retry);
  }
});
```

## Contributors

Special thanks to Ryan Schmukler and Matthew Mueller for code used in
`mio-ajax` taken from `modella-ajax`.

## MIT Licensed
