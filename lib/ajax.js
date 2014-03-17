var request = require('superagent'),
    qs = require('querystring');

module.exports = function(baseUrl, urlOverrides) {
  return function(Model) {
    Model.options.ajax = {
      actions: {
        index:   { url: '',          method: 'get'  },
        count:   { url: '/count',    method: 'get'  },
        create:  { url: '',          method: 'post' },
        show:    { url: '/:primary', method: 'get'  },
        update:  { url: '/:primary', method: 'put'  },
        destroy: { url: '/:primary', method: 'del'  }
      },
      baseUrl: baseUrl,
      header: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    if (urlOverrides) {
      for (var key in urlOverrides) {
        if (typeof urlOverrides[key] == 'string') {
          Model.options.ajax.actions[key] = {
            url: urlOverrides[key],
            method: Model.options.ajax.actions[key].method
          };
        }
        else {
          urlOverrides[key].method = urlOverrides[key].method.toLowerCase();
          if (urlOverrides[key].method == 'delete') {
            urlOverrides[key].method = 'del';
          }
          Model.options.ajax.actions[key] = urlOverrides[key];
        }
      }
    }

    Model.stores.push(store);
  };
};

var store = exports.store = Object.create(null);

store.urlForAction = function(action, extras) {
  var url = (this.options || this.constructor.options).ajax.actions[action].url;

  if (typeof extras != 'object' && typeof extras != 'undefined') {
    url = url.replace(/:primary/g, extras);
  }

  var model = this;

  url = url.replace(/:(\w+)/g, function(match, attr) {
    if (attr == 'primary') attr = 'id';
    if (typeof extras == 'object' && extras[attr]) {
      var value = extras[attr];
      delete extras[attr];
      return value;
    }
    return model[attr];
  });

  return (this.options || this.constructor.options).ajax.baseUrl + url;
};

store.errorForRes = function(Model, error, req, res, cb) {
  if (res && res.error) {
    error = res.error;
    if (res.body) {
      for (var key in res.body) {
        error[key] = res.body[key];
      }
      if (res.body.msg) {
        error.message = res.body.msg;
      }
    }
  }

  if (!error) return null;

  var retry = function() {
    req.abort();
    req.url = req.url.split('?').shift();

    Model.emit('ajax request', req);

    req.end(function(err, res) {
      Model.emit('ajax response', res);
      cb(store.errorForRes(Model, err, req, res, cb), res ? res.body : res);
    });
  };

  error.code = error.status || error.code;
  error.retry = retry;

  Model.emit('ajax error', error, retry);
  Model.emit('error', error);

  return error;
};

store.findAll = function(query, cb) {
  var Model = this;

  var url = store.urlForAction.call(Model, 'index', query);
  var method = Model.options.ajax.actions.index.method;
  var req = request[method](url).set(Model.options.ajax.header);

  if (typeof query == 'object' && Object.keys(query).length) {
    req.query(qs.stringify(query));
  }

  Model.emit('ajax request', req);

  req.end(function(err, res) {
    Model.emit('ajax response', res);

    err = store.errorForRes(Model, err, req, res, cb);

    if (res && typeof res.body === 'object' && res.body.length) {
      for (var i=0, l=res.body.length; i<l; i++) {
        res.body[i] = Model.create(res.body[i]);
      }
    }

    cb(err, res ? res.body : res);
  });
};

store.count = function(query, cb) {
  var Model = this;

  var url = store.urlForAction.call(Model, 'count', query);
  var method = Model.options.ajax.actions.count.method;
  var req = request[method](url).set(Model.options.ajax.header);

  if (typeof query == 'object' && Object.keys(query).length) {
    req.query(qs.stringify(query));
  }

  Model.emit('ajax request', req);

  req.end(function(err, res) {
    Model.emit('ajax response', res);
    err = store.errorForRes(Model, err, req, res, cb);
    cb(err, res ? res.body : res);
  });
};

store.find = function(extras, cb) {
  var Model = this;

  var url = store.urlForAction.call(Model, 'show', extras);
  var method = Model.options.ajax.actions.show.method;
  var req = request[method](url).set(Model.options.ajax.header);

  if (typeof extras == 'object' && Object.keys(extras).length) {
    req.query(qs.stringify(extras));
  }

  Model.emit('ajax request', req);

  req.end(function(err, res) {
    Model.emit('ajax response', res);
    err = store.errorForRes(Model, err, req, res, cb);
    cb(err, res ? Model.create(res.body) : res);
  });
};

store.save = function(changed, cb) {
  if (this.primary) {
    return store.update.call(this, changed, cb);
  }

  var Model = this.constructor;

  var url = store.urlForAction.call(this, 'create');
  var method = Model.options.ajax.actions.create.method;
  var req = request[method](url).set(Model.options.ajax.header).send(changed);

  Model.emit('ajax request', req);

  req.end(function(err, res) {
    Model.emit('ajax response', res);
    cb(store.errorForRes(Model, err, req, res, cb));
  });
};

store.update = function(changed, cb) {
  var Model = this.constructor;

  var url = store.urlForAction.call(this, 'update');
  var method = Model.options.ajax.actions.update.method;
  var req = request[method](url).set(Model.options.ajax.header).send(changed);

  Model.emit('ajax request', req);

  req.end(function(err, res) {
    Model.emit('ajax response', res);
    cb(store.errorForRes(Model, err, req, res, cb));
  });
};

store.remove = function(cb) {
  var Model = this.constructor;

  var url = store.urlForAction.call(this, 'destroy');
  var method = Model.options.ajax.actions.destroy.method;
  var req = request[method](url);

  Model.emit('ajax request', req);

  req.end(function(err, res) {
    Model.emit('ajax response', res);
    cb(store.errorForRes(Model, err, req, res, cb));
  });
};
