var request = require('superagent'),
    mio = require('mio'),
    extend = require('extend')
    qs = require('querystring');

module.exports = function(baseUrl, urlOverrides) {
  var Model = this;

  var header = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  var urlMap = extend({
    create:     '',
    list:       '',
    read:       '/:primary',
    remove:     '/:primary',
    removeAll:  '',
    update:     '/:primary'
  }, urlOverrides);

  Model.options.baseUrl = baseUrl;

  Model.adapter.findAll = function(query, cb) {
    if (typeof query === 'function') {
      cb = query;
      query = {};
    }
    var url = urlForAction.call(this, 'list', query);
    var req = request.get(url).set(header);
    if (typeof query == 'object' && Object.keys(query).length) {
      req.query(query);
    }
    Model.emit('ajax request', req);
    req.end(function(res) {
      Model.emit('ajax all', res);
      var collection = [];
      collection.total = res.body ? res.body.total : 0;
      collection.offset = res.body ? res.body.offset : 0;
      collection.limit = res.body ? res.body.limit : 50;
      if (res.body && res.body.data instanceof Array) {
        for (var len = res.body.data.length, i=0; i<len; i++) {
          collection.push(res.body.data[i]);
        }
      }
      cb(errorForRes.call(Model, res), collection);
    });
  };

  Model.adapter.find = function(extras, cb) {
    var url = urlForAction.call(this, 'read', extras);
    var req = request.get(url).set(header);
    if (typeof extras == 'object' && Object.keys(extras).length) {
      req.query(extras);
    }
    Model.emit('ajax request', req);
    req.end(function(res) {
      Model.emit('ajax get', res);
      cb(errorForRes.call(Model, res), res.body);
    });
  };

  Model.adapter.removeAll = function(query, fn) {
    var url = urlForAction.call(this, 'removeAll');
    if (typeof query === 'function') {
      fn = query;
      query = {};
    }
    var req = request.del(url).query(query).set(header);
    Model.emit('ajax request', req);
    req.end(function(res) {
      Model.emit('ajax removeAll', res);
      fn(errorForRes.call(Model, res), res.body);
    });
  };

  Model.adapter.save = function(changed, fn) {
    if (this.primary) {
      return this.constructor.adapter.update.call(this, changed, fn);
    }
    var url = urlForAction.call(this, 'create');
    var req = request.post(url).set(header).send(changed);
    Model.emit('ajax request', req);
    req.end(function(res) {
      Model.emit('ajax save', res);
      fn(errorForRes.call(Model, res), res.body);
    });
  };

  Model.adapter.update = function(changed, fn) {
    var url = urlForAction.call(this, 'update');
    var req = request.put(url).set(header).send(changed);
    Model.emit('ajax request', req);
    req.end(function(res) {
      Model.emit('ajax update', res);
      fn(errorForRes.call(Model, res), res.body);
    });
  };

  Model.adapter.remove = function(fn) {
    var url = urlForAction.call(this, 'remove');
    var req = request.del(url);
    Model.emit('ajax request', req);
    req.end(function(res) {
      Model.emit('ajax remove', res);
      fn(errorForRes.call(Model, res), res.body);
    });
  };

  function urlForAction(action, extras) {
    var url = urlMap[action];

    if (typeof extras != 'object' && typeof extras != 'undefined') {
      url = url.replace(/:primary/g, extras);
    }

    var self = this;
    url = url.replace(/:(\w+)/g, function(match, attr) {
      if (attr == 'primary') attr = 'id';
      if (typeof extras == 'object' && extras[attr]) {
        var value = extras[attr];
        delete extras[attr];
        return value;
      }
      return self[attr];
    });

    return baseUrl + url;
  };
};

function errorForRes(res) {
  var error;

  if (error = res.error) {
    if (res.text && res.type == 'application/json') {
      var body = JSON.parse(res.text);
      error = new Error(body.message || body.msg || error.message);
      error.code = body.code || body.status || error.code;
      error.errors = body.errors;
      error.body = body;
    }
    this.emit('ajax error', error);
    this.emit('error', error);
    return error;
  }
  return null;
}
