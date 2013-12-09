# mio-ajax

[![Build Status](https://secure.travis-ci.org/alexmingoia/mio-ajax.png?branch=master)](http://travis-ci.org/alexmingoia/mio-ajax)
[![Dependency Status](https://david-dm.org/alexmingoia/mio-ajax.png)](http://david-dm.org/alexmingoia/mio-ajax)
[![Coverage Status](https://coveralls.io/repos/alexmingoia/mio-ajax/badge.png?branch=master)](https://coveralls.io/r/alexmingoia/mio-ajax?branch=master)

Provides an AJAX storage plugin for [Mio](https://github.com/mio/mio).

## Installation

Install using [component](https://github.com/component/component/):

```sh
component install mio/mio-ajax
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

The default urls looks like the following:

```javascript
var urlMap = {
  create:     '',
  list:       '',
  read:       '/:primary',
  remove:     '/:primary',
  removeAll:  '',
  update:     '/:primary'
};
```

Override them if needed:

```javascript
User.use('browser', require('mio-ajax'), '/api/v1/users', {
  read:   '/:username',
  update: '/:username',
  remove: '/:username'
});
```

This would make it so that the following routes were used:

    READ   ->  GET /api/v1/users/:username
    UPDATE ->  PUT /api/v1/users/:username
    REMOVE ->  DEL /api/v1/users/:username

### Events

#### ajax request

Emitted before XHR request is sent.

```javascript
User.on('ajax request', function(req) {
  // req is superagent request object
  req.set('Authorization', 'Bearer 13a9-34b3-a8da-c78d');
});
```

#### ajax all

Emitted before `Model.all()` instantiates the model instances.

```javascript
User.on('ajax all', function(res) {
  var users = res.body.results;
  // Convert JSON string dates into actual dates
  users.forEach(u) {
     u.registeredAt = new Date(u.registeredAt);
  }
  res.body = users;
});
```

#### ajax get

Emitted before `Model.get()` instantiates the model instance.

```javascript
User.on('ajax get', function(res) {
  res.body.registeredAt = new Date(res.body.registeredAt);
});
```

#### ajax removeAll

Emitted before `Model.removeAll()` passes response to callback.

#### ajax save

Emitted before `model.save()` passes response to callback.

#### ajax update

Emitted before `model.update()` passes response to callback.

#### ajax remove

Emitted before `model.remove()` passes response to callback.

## Contributors

Special thanks to Ryan Schmukler and Matthew Mueller for code used in
`mio-ajax` taken from `modella-ajax`.

## MIT Licensed
