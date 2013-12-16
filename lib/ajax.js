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
    var url = urlForAction.call(this, 'list', query);
    var req = request.get(url).set(header);
    if (typeof query == 'object' && Object.keys(query).length) {
      req.query(query);
    }
    Model.emit('ajax request', req);
    req.end(function(err, res) {
      Model.emit('ajax response', res);
      cb(errorForRes(err, req, res, cb), res ? res.body : res);
    });
  };

  Model.adapter.find = function(extras, cb) {
    var url = urlForAction.call(this, 'read', extras);
    var req = request.get(url).set(header);
    if (typeof extras == 'object' && Object.keys(extras).length) {
      req.query(extras);
    }
    Model.emit('ajax request', req);
    req.end(function(err, res) {
      Model.emit('ajax response', res);
      cb(errorForRes(err, req, res, cb), res ? res.body : res);
    });
  };

  Model.adapter.removeAll = function(query, cb) {
    var url = urlForAction.call(this, 'removeAll');
    var req = request.del(url).query(query).set(header);
    Model.emit('ajax request', req);
    req.end(function(err, res) {
      Model.emit('ajax response', res);
      cb(errorForRes(err, req, res, cb), res ? res.body : res);
    });
  };

  Model.adapter.save = function(changed, cb) {
    if (this.primary) {
      return this.constructor.adapter.update.call(this, changed, cb);
    }
    var url = urlForAction.call(this, 'create');
    var req = request.post(url).set(header).send(changed);
    Model.emit('ajax request', req);
    req.end(function(err, res) {
      Model.emit('ajax response', res);
      cb(errorForRes(err, req, res, cb), res ? res.body : res);
    });
  };

  Model.adapter.update = function(changed, cb) {
    var url = urlForAction.call(this, 'update');
    var req = request.put(url).set(header).send(changed);
    Model.emit('ajax request', req);
    req.end(function(err, res) {
      Model.emit('ajax response', res);
      cb(errorForRes(err, req, res, cb), res ? res.body : res);
    });
  };

  Model.adapter.remove = function(cb) {
    var url = urlForAction.call(this, 'remove');
    var req = request.del(url);
    Model.emit('ajax request', req);
    req.end(function(err, res) {
      Model.emit('ajax response', res);
      cb(errorForRes(err, req, res, cb), res ? res.body : res);
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

  function errorForRes(error, req, res, cb) {
    if (res && res.error) {
      error = res.error;
      if (res.body) {
        error.message = res.body.message || res.body.msg;
      }
    }

    if (!error) return null;

    var retry = function() {
      req.abort();
      req.end(function(err, res) {
        cb(errorForRes(err, req, res, cb), res.body);
      });
    };

    error.code = error.status || error.code;
    error.retry = retry;

    Model.emit('ajax error', error, retry);
    Model.emit('error', error);

    return error;
  };
};
