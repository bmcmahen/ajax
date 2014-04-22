var request = require('superagent');

try {
  var qs = require('qs');
}
catch (err) {
  var qs = require('querystring');
}

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

    Model
      .use('find', store.find)
      .use('findAll', store.findAll)
      .use('count', store.count)
      .use('save', store.save)
      .use('remove', store.remove);
  };
};

var store = exports.store = Object.create(null);

store.findAll = function(query, cb) {
  var Model = this;
  var opts = Model.options;

  var url = urlForAction('index', opts, query);
  var method = opts.ajax.actions.index.method;
  var req = request[method](url).set(opts.ajax.header);

  if (typeof query == 'object' && Object.keys(query).length) {
    req.query(qs.stringify(query));
  }

  Model.emit('ajax request', req);

  req.end(function(err, res) {
    Model.emit('ajax response', res);

    err = errorForRes(Model, err, req, res, cb);

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
  var opts = Model.options;

  var url = urlForAction('count', opts, query);
  var method = opts.ajax.actions.count.method;
  var req = request[method](url).set(opts.ajax.header);

  if (typeof query == 'object' && Object.keys(query).length) {
    req.query(qs.stringify(query));
  }

  Model.emit('ajax request', req);

  req.end(function(err, res) {
    Model.emit('ajax response', res);
    err = errorForRes(Model, err, req, res, cb);
    cb(err, res ? res.body : res);
  });
};

store.find = function(extras, cb) {
  var Model = this;
  var opts = Model.options;

  var url = urlForAction('show', opts, extras);
  var method = opts.ajax.actions.show.method;
  var req = request[method](url).set(opts.ajax.header);

  if (typeof extras == 'object' && Object.keys(extras).length) {
    req.query(qs.stringify(extras));
  }

  Model.emit('ajax request', req);

  req.end(function(err, res) {
    Model.emit('ajax response', res);
    err = errorForRes(Model, err, req, res, cb);
    cb(err, res ? Model.create(res.body) : res);
  });
};

store.save = function(changed, cb) {
  if (this.primary) {
    return store.update.call(this, changed, cb);
  }

  var Model = this.constructor;
  var opts = Model.options;

  var url = urlForAction.call(this, 'create', opts);
  var method = opts.ajax.actions.create.method;
  var req = request[method](url).set(opts.ajax.header).send(changed);

  Model.emit('ajax request', req);

  req.end(function(err, res) {
    Model.emit('ajax response', res);
    cb(errorForRes(Model, err, req, res, cb));
  });
};

store.update = function(changed, cb) {
  var Model = this.constructor;
  var opts = Model.options;

  var url = urlForAction.call(this, 'update', opts);
  var method = opts.ajax.actions.update.method;
  var req = request[method](url).set(opts.ajax.header).send(changed);

  Model.emit('ajax request', req);

  req.end(function(err, res) {
    Model.emit('ajax response', res);
    cb(errorForRes(Model, err, req, res, cb));
  });
};

store.remove = function(cb) {
  var Model = this.constructor;
  var opts = Model.options;

  var url = urlForAction.call(this, 'destroy', opts);
  var method = opts.ajax.actions.destroy.method;
  var req = request[method](url);

  Model.emit('ajax request', req);

  req.end(function(err, res) {
    Model.emit('ajax response', res);
    cb(errorForRes(Model, err, req, res, cb));
  });
};

function urlForAction(action, opts, extras) {
  var url = opts.ajax.actions[action].url;
  var model = this;

  if (typeof extras != 'object' && typeof extras != 'undefined') {
    url = url.replace(/:primary/g, extras);
  }

  url = url.replace(/:(\w+)/g, function(match, attr) {
    if (attr == 'primary') attr = 'id';
    if (typeof extras == 'object' && extras[attr]) {
      var value = extras[attr];
      delete extras[attr];
      return value;
    }
    return model[attr];
  });

  return opts.ajax.baseUrl + url;
};

function errorForRes(Model, error, req, res, cb) {
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
      cb(errorForRes(Model, err, req, res, cb), res ? res.body : res);
    });
  };

  error.code = error.status || error.code;
  error.retry = retry;

  Model.emit('ajax error', error, retry);
  Model.emit('error', error);

  return error;
};
