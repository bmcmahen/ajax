var request = require('superagent'),
    qs = require('querystring');

module.exports = function(baseUrl, urlOverrides) {
  return function() {
    var Model = this;

    var header = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    var actions = {
      index:   { url: '',          method: 'get'  },
      count:   { url: '/count',    method: 'get'  },
      create:  { url: '',          method: 'post' },
      show:    { url: '/:primary', method: 'get'  },
      update:  { url: '/:primary', method: 'put'  },
      destroy: { url: '/:primary', method: 'del'  }
    };

    if (urlOverrides) {
      for (var key in urlOverrides) {
        if (typeof urlOverrides[key] == 'string') {
          actions[key] = {
            url: urlOverrides[key],
            method: actions[key].method
          };
        }
        else {
          urlOverrides[key].method = urlOverrides[key].method.toLowerCase();
          if (urlOverrides[key].method == 'delete') {
            urlOverrides[key].method = 'del';
          }
          actions[key] = urlOverrides[key];
        }
      }
    }

    Model.options.baseUrl = baseUrl;

    Model.adapter.findAll = function(query, cb) {
      var url = urlForAction.call(this, 'index', query);
      var method = actions.index.method;
      var req = request[method](url).set(header);
      if (typeof query == 'object' && Object.keys(query).length) {
        req.query(qs.stringify(query));
      }
      Model.emit('ajax request', req);
      req.end(function(err, res) {
        Model.emit('ajax response', res);
        cb(errorForRes(err, req, res, cb), res ? res.body : res);
      });
    };

    Model.adapter.count = function(query, cb) {
      var url = urlForAction.call(this, 'count', query);
      var method = actions.count.method;
      var req = request[method](url).set(header);
      if (typeof query == 'object' && Object.keys(query).length) {
        req.query(qs.stringify(query));
      }
      Model.emit('ajax request', req);
      req.end(function(err, res) {
        Model.emit('ajax response', res);
        cb(errorForRes(err, req, res, cb), res ? res.body : res);
      });
    };

    Model.adapter.find = function(extras, cb) {
      var url = urlForAction.call(this, 'show', extras);
      var method = actions.show.method;
      var req = request[method](url).set(header);
      if (typeof extras == 'object' && Object.keys(extras).length) {
        req.query(qs.stringify(extras));
      }
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
      var method = actions.create.method;
      var req = request[method](url).set(header).send(changed);
      Model.emit('ajax request', req);
      req.end(function(err, res) {
        Model.emit('ajax response', res);
        cb(errorForRes(err, req, res, cb), res ? res.body : res);
      });
    };

    Model.adapter.update = function(changed, cb) {
      var url = urlForAction.call(this, 'update');
      var method = actions.update.method;
      var req = request[method](url).set(header).send(changed);
      Model.emit('ajax request', req);
      req.end(function(err, res) {
        Model.emit('ajax response', res);
        cb(errorForRes(err, req, res, cb), res ? res.body : res);
      });
    };

    Model.adapter.remove = function(cb) {
      var url = urlForAction.call(this, 'destroy');
      var method = actions.destroy.method;
      var req = request[method](url);
      Model.emit('ajax request', req);
      req.end(function(err, res) {
        Model.emit('ajax response', res);
        cb(errorForRes(err, req, res, cb), res ? res.body : res);
      });
    };

    Model.adapter.related = {
      findAll: function(relation, query, done) {
        query[relation.foreignKey] = this.primary;
        relation.anotherModel.findAll(query, done);
      },
      count: function(relation, query, done) {
        query[relation.foreignKey] = this.primary;
        relation.anotherModel.count(query, done);
      },
      has: function(relation, model, done) {
        var query = {};
        query[relation.foreignKey] = this.primary;
        relation.anotherModel.count(query, function(err, count) {
          if (err) return done(err);
          done(null, (count > 0));
        });
      },
      find: function(relation, query, done) {
        query[relation.foreignKey] = this.primary;
        relation.anotherModel.find(query, done);
      },
    };

    function urlForAction(action, extras) {
      var url = actions[action].url;

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
        Model.emit('ajax request', req);
        req.end(function(err, res) {
          Model.emit('ajax response', res);
          cb(errorForRes(err, req, res, cb), res ? res.body : res);
        });
      };

      error.code = error.status || error.code;
      error.retry = retry;

      Model.emit('ajax error', error, retry);
      Model.emit('error', error);

      return error;
    };
  };

};
