var expect = require('expect.js');
var superagent = require('superagent');
var ajax = process.env.JSCOV ? require('../lib-cov/ajax') : require('../lib/ajax');

var User = require('mio').createModel('User')
  .attr('id', { primary: true })
  .attr('name')
  .use(ajax, '/users');

describe("AJAX storage plugin", function() {
  it("sets the base url", function() {
    expect(User.options.baseUrl).to.be('/users');
  });

  it('retries failed requests', function(done) {
      var get = superagent.get;
      var superagentApi = {
        abort: function() {return this;},
        query: function(query) {
          expect(query).to.eql({});
          return this;
        },
        set: function () { return this; },
        end: function(cb) { cb(new Error('test')); }
      };
      superagent.get = function(url) {
        expect(url).to.be('/users');
        return superagentApi;
      };
      User.once('ajax error', function(error, retry) {
        expect(retry).to.be.a('function');
        superagentApi.end = function(cb) {
          cb(null, [{}]);
        };
        retry();
      });
      User.all(function(err, users) {
        if (users) {
          superagent.get = get;
          done();
        }
      });
  });

  describe(".findAll()", function() {
    it("does a GET request to the base url", function(done) {
      var get = superagent.get;
      var superagentApi = {
        query: function(query) {
          expect(query).to.eql({});
          return this;
        },
        set: function () { return this; },
        end: function(cb) { cb(null, [{}]); }
      };
      superagent.get = function(url) {
        expect(url).to.be('/users');
        return superagentApi;
      };

      User.all(function() {
        superagent.get = get;
        done();
      });
    });

    it("passes query to superagent", function(done) {
      var get = superagent.get;
      var superagentApi = {
        query: function(query) {
          expect(query).to.eql({ name: "bob" });
          return this;
        },
        set: function () { return this; },
        end: function(cb) { cb(null, {}); }
      };
      superagent.get = function(url) {
        expect(url).to.be('/users');
        return superagentApi;
      };

      User.all({ name: "bob" }, function() {
        superagent.get = get;
        done();
      });
    });

    it("sets header for request", function(done) {
      var get = superagent.get;
      var superagentApi = {
        query: function() { return this; },
        set: function (header) {
          expect(header).to.have.property('Accept', 'application/json');
          return this;
        },
        end: function(cb) { cb(null, {error: null, body: [{id: "0", name: "Bob"}, {id: "1", name: "Tobi"}]}); }
      };
      superagent.get = function(url) {
        return superagentApi;
      };
      User.all(function(err, body) {
        expect(err).to.be(null);
        superagent.get = get;
        done();
      });
    });

    it("passes along data from superagent", function(done) {
      var get = superagent.get;
      var superagentApi = {
        query: function() { return this; },
        set: function () { return this; },
        end: function(cb) {
          cb(null, {error: null, body: [{id: 0, name: "Bob"}, {id: 1, name: "Tobi"}]});
        }
      };
      superagent.get = function(url) {
        return superagentApi;
      };

      User.all(function(err, body) {
        expect(err).to.be(null);
        expect(body).to.have.length(2);
        superagent.get = get;
        done();
      });
    });

    it("passes along errors from superagent", function(done) {
      var get = superagent.get;
      var superagentApi = {
        query: function() { return this; },
        set: function () { return this; },
        end: function(cb) { cb(null, {error: true, body: undefined}); }
      };
      superagent.get = function(url) {
        return superagentApi;
      };

      User.all(function(err, body) {
        expect(err).to.be(true);
        superagent.get = get;
        done();
      });
    });

    it('emits "ajax response" event', function(done) {
      var get = superagent.get;
      var superagentApi = {
        type:  function () { return this; },
        query: function() { return this; },
        set: function () { return this; },
        end: function(cb) { cb(null, []); }
      };
      superagent.get = function(url) {
        return superagentApi;
      };
      User.once('ajax response', function(res) {
        superagent.get = get;
        expect(res).to.be.an('array');
        done();
      });
      User.all(function() {});
    });

    it('emits "ajax request" event', function(done) {
      var get = superagent.get;
      var superagentApi = {
        type:  function () { return this; },
        query: function() { return this; },
        set: function () { return this; },
        end: function(cb) { cb(null, []); }
      };
      superagent.get = function(url) {
        return superagentApi;
      };
      User.once('ajax request', function(req) {
        superagent.get = get;
        expect(req).to.have.keys('type', 'query', 'set', 'end');
        done();
      });
      User.all(function() {});
    });
  });

  describe(".count()", function() {
    it("does a GET request to the base url", function(done) {
      var get = superagent.get;
      var superagentApi = {
        query: function(query) {
          expect(query).to.eql({});
          return this;
        },
        set: function () { return this; },
        end: function(cb) { cb(null, [{}]); }
      };
      superagent.get = function(url) {
        expect(url).to.be('/users/count');
        return superagentApi;
      };

      User.count(function() {
        superagent.get = get;
        done();
      });
    });

    it("passes query to superagent", function(done) {
      var get = superagent.get;
      var superagentApi = {
        query: function(query) {
          expect(query).to.eql({ name: "bob" });
          return this;
        },
        set: function () { return this; },
        end: function(cb) { cb(null, {}); }
      };
      superagent.get = function(url) {
        expect(url).to.be('/users/count');
        return superagentApi;
      };

      User.count({ name: "bob" }, function() {
        superagent.get = get;
        done();
      });
    });

    it("sets header for request", function(done) {
      var get = superagent.get;
      var superagentApi = {
        query: function() { return this; },
        set: function (header) {
          expect(header).to.have.property('Accept', 'application/json');
          return this;
        },
        end: function(cb) { cb(null, {error: null, body: null}); }
      };
      superagent.get = function(url) {
        return superagentApi;
      };
      User.count(function(err, body) {
        expect(err).to.be(null);
        superagent.get = get;
        done();
      });
    });

    it("passes along errors from superagent", function(done) {
      var get = superagent.get;
      var superagentApi = {
        query: function() { return this; },
        set: function () { return this; },
        end: function(cb) { cb(null, {error: true, body: undefined}); }
      };
      superagent.get = function(url) {
        return superagentApi;
      };

      User.count(function(err, body) {
        expect(err).to.be(true);
        superagent.get = get;
        done();
      });
    });

    it('emits "ajax response" event', function(done) {
      var get = superagent.get;
      var superagentApi = {
        type:  function () { return this; },
        query: function() { return this; },
        set: function () { return this; },
        end: function(cb) { cb(null, 2); }
      };
      superagent.get = function(url) {
        return superagentApi;
      };
      User.once('ajax response', function(res) {
        superagent.get = get;
        expect(res).to.be.a('number');
        done();
      });
      User.count(function() {});
    });

    it('emits "ajax request" event', function(done) {
      var get = superagent.get;
      var superagentApi = {
        type:  function () { return this; },
        query: function() { return this; },
        set: function () { return this; },
        end: function(cb) { cb(null, []); }
      };
      superagent.get = function(url) {
        return superagentApi;
      };
      User.once('ajax request', function(req) {
        superagent.get = get;
        expect(req).to.have.keys('type', 'query', 'set', 'end');
        done();
      });
      User.count(function() {});
    });
  });

  describe(".find()", function() {

    it("does a GET request to the base url with the ID", function(done) {
      var get = superagent.get;
      var superagentApi = {
        set: function () { return this; },
        end: function(cb) { cb(null, {}); }
      };
      superagent.get = function(url) {
        expect(url).to.be('/users/1');
        return superagentApi;
      };

      var find = User.find;
      User.get = function(extras, cb) {
        User.adapter.find.call(User, 1, cb);
        User.get = find;
      };
      User.get(1, function() {
        superagent.get = get;
        done();
      });
    });

    it('supports extra query parameters', function(done) {
      var get = superagent.get;
      var superagentApi = {
        set: function () { return this; },
        query: function(query) { return this; },
        end: function(cb) { cb(null, {error: null, body: {id: 1, name: "Bob"}}); }
      };
      superagent.get = function(url) {
        return superagentApi;
      };

      User.get({ id: 1, post_id: 2 }, function(err, body) {
        expect(err).to.be(null);
        expect(body).to.have.property('id', 1);
        superagent.get = get;
        done();
      });
    });

    it("passes along data from superagent", function(done) {
      var get = superagent.get;
      var superagentApi = {
        set: function () { return this; },
        end: function(cb) { cb(null, {error: null, body: {id: 1, name: "Bob"}}); }
      };
      superagent.get = function(url) {
        return superagentApi;
      };

      User.get(1, function(err, body) {
        expect(err).to.be(null);
        expect(body).to.have.property('id', 1);
        superagent.get = get;
        done();
      });
    });

    it("sets header for request", function(done) {
      var get = superagent.get;
      var superagentApi = {
        set: function (header) {
          expect(header).to.have.property('Accept', 'application/json');
          return this;
        },
        end: function(cb) { cb(null, {error: null, body: {id: 1, name: "Bob"}}); }
      };
      superagent.get = function(url) {
        return superagentApi;
      };
      User.get(1, function(err, user) {
        expect(err).to.be(null);
        expect(user).to.be.a(User);
        expect(user.primary).to.be(1);
        superagent.get = get;
        done();
      });
    });

    it("passes along errors from superagent", function(done) {
      var get = superagent.get;
      var superagentApi = {
        set: function () { return this; },
        end: function(cb) {
          cb(null, {
            error: new Error('test'),
            body: {
              status: 401,
              message: 'body message'
            }
          });
        }
      };
      superagent.get = function(url) {
        return superagentApi;
      };

      User.get(1, function(err, body) {
        expect(err).to.have.property('message', 'body message');
        superagent.get = get;
        done();
      });
    });

    it('emits "ajax response" event', function(done) {
      var get = superagent.get;
      var superagentApi = {
        type:  function () { return this; },
        set: function () { return this; },
        end: function(cb) { cb(null, { body: {id: 1} }); }
      };
      superagent.get = function(url) {
        expect(url).to.be('/users/1');
        return superagentApi;
      };
      User.once('ajax response', function(res) {
        superagent.get = get;
        expect(res).to.have.property('body');
        expect(res.body).to.have.property('id', 1);
        done();
      });
      User.get(1, function() {});
    });

    it('emits "ajax request" event', function(done) {
      var get = superagent.get;
      var superagentApi = {
        type:  function () { return this; },
        set: function () { return this; },
        end: function(cb) { cb(null, { body: {id: 1} }); }
      };
      superagent.get = function(url) {
        expect(url).to.be('/users/1');
        return superagentApi;
      };
      User.once('ajax request', function(req) {
        superagent.get = get;
        expect(req).to.have.keys('type', 'set', 'end');
        done();
      });
      User.get(1, function() {});
    });
  });

  describe(".save()", function() {
    it("does a POST request to the base URL", function(done) {
      var post = superagent.post;
      var superagentApi = {
        set:  function () { return this; },
        send: function () { return this; },
        end:  function(cb) { cb(null, {}); }
      };
      superagent.post = function(url) {
        expect(url).to.be('/users');
        return superagentApi;
      };

      var user = new User();
      user.name = 'Bob';
      user.save(function() {
        superagent.post = post;
        done();
      });
    });

    it("POSTs the attributes of the model", function(done) {
      var post = superagent.post;
      var superagentApi = {
        set:  function () { return this; },
        send: function (data) {
          expect(data).to.have.property('name', 'Bob');
          return this;
        },
        end:  function(cb) { cb(null, {}); }
      };
      superagent.post = function(url) {
        return superagentApi;
      };

      var user = new User();
      user.name = 'Bob';
      user.save(function() {
        superagent.post = post;
        done();
      });
    });

    it("passes along data from superagent", function(done) {
      var post = superagent.post;
      var superagentApi = {
        set:  function () { return this; },
        send: function () { return this; },
        end:  function(cb) { cb(null, {body: {id: 513}}); }
      };
      superagent.post = function(url) {
        return superagentApi;
      };

      var user = new User();
      user.name = 'Bob';
      user.save(function(err) {
        expect(user.id).to.be(513);
        superagent.post = post;
        done();
      });
    });

    it("sets header for request", function(done) {
      var post = superagent.post;
      var superagentApi = {
        set: function (header) {
          expect(header).to.have.property('Accept', 'application/json');
          return this;
        },
        send: function () { return this; },
        end:  function(cb) { cb(null, {body: {id: 513}}); }
      };
      superagent.post = function(url) {
        return superagentApi;
      };

      var user = new User();
      user.name = 'Bob';
      user.save(function(err) {
        expect(user.id).to.be(513);
        superagent.post = post;
        done();
      });
    });

    it("passes along errors from superagent", function(done) {
      var post = superagent.post;
      var superagentApi = {
        set:  function () { return this; },
        send: function () { return this; },
        end:  function(cb) { cb(null, {error: true}); }
      };
      superagent.post = function(url) {
        return superagentApi;
      };

      var user = new User();
      user.name = 'Bob';
      user.save(function(err) {
        expect(err).to.be(true);
        superagent.post = post;
        done();
      });
    });

    it('emits "ajax response" event', function(done) {
      var post = superagent.post;
      var superagentApi = {
        set:  function () { return this; },
        send: function () { return this; },
        end:  function(cb) { cb(null, {body: {id: 513}}); }
      };
      superagent.post = function(url) {
        return superagentApi;
      };
      var user = new User();
      user.name = 'Bob';
      User.once('ajax response', function(res) {
        superagent.post = post;
        expect(res).to.have.property('body');
        expect(res.body).to.have.property('id', 513);
        done();
      });
      user.save(function() {});
    });

    it('emits "ajax request" event', function(done) {
      var post = superagent.post;
      var superagentApi = {
        set:  function () { return this; },
        send: function () { return this; },
        end:  function(cb) { cb(null, {body: {id: 513}}); }
      };
      superagent.post = function(url) {
        return superagentApi;
      };
      var user = new User();
      user.name = 'Bob';
      User.once('ajax request', function(req) {
        superagent.post = post;
        expect(req).to.have.keys('set', 'send', 'end');
        done();
      });
      user.save(function() {});
    });
  });

  describe(".update()", function() {
    it("does a PUT request to the base URL with the ID", function(done) {
      var put = superagent.put;
      var superagentApi = {
        set:  function () { return this; },
        send: function () { return this; },
        end:  function(cb) { cb(null, {}); }
      };
      superagent.put = function(url) {
        expect(url).to.be('/users/1');
        return superagentApi;
      };

      var user = new User({id: "1"});
      user.name = 'Bob';
      user.save(function() {
        superagent.put = put;
        done();
      });
    });

    it("PUTs the attributes of the model", function(done) {
      var put = superagent.put;
      var superagentApi = {
        set:  function () { return this; },
        send: function (data) {
          expect(data).to.have.property('name', 'Bob');
          return this;
        },
        end:  function(cb) { cb(null, {}); }
      };
      superagent.put = function(url) {
        return superagentApi;
      };

      var user = new User({id: "1"});
      user.name = 'Bob';
      user.save(function() {
        superagent.put = put;
        done();
      });
    });

    it("passes along data from superagent", function(done) {
      var put = superagent.put;
      var superagentApi = {
        set:  function () { return this; },
        send: function () { return this; },
        end:  function(cb) { cb(null, {body: {name: "Bobby"}}); }
      };
      superagent.put = function(url) {
        return superagentApi;
      };

      var user = new User({id: "123"});
      user.name = 'Bob';
      user.save(function(err) {
        expect(user.name).to.be("Bobby");
        superagent.put = put;
        done();
      });
    });

    it("sets header for requst", function(done) {
      var put = superagent.put;
      var superagentApi = {
        set: function (header) {
          expect(header).to.have.property('Accept', 'application/json');
          return this;
        },
        send: function () { return this; },
        end:  function(cb) { cb(null, {body: {name: "Bobby"}}); }
      };
      superagent.put = function(url) {
        return superagentApi;
      };

      var user = new User({id: "123"});
      user.name = 'Bob';
      user.save(function(err) {
        expect(user.name).to.be("Bobby");
        superagent.put = put;
        done();
      });
    });

    it("passes along errors from superagent", function(done) {
      var put = superagent.put;
      var superagentApi = {
        set:  function () { return this; },
        send: function () { return this; },
        end:  function(cb) { cb(null, {error: true}); }
      };
      superagent.put = function(url) {
        return superagentApi;
      };

      var user = new User({id: "123"});
      user.name = 'Bob';
      user.save(function(err) {
        expect(err).to.be(true);
        superagent.put = put;
        done();
      });
    });

    it('emits "ajax response" event', function(done) {
      var put = superagent.put;
      var superagentApi = {
        set:  function () { return this; },
        send: function () { return this; },
        end:  function(cb) { cb(null, {body: {name: "Bobby"}}); }
      };
      superagent.put = function(url) {
        return superagentApi;
      };

      var user = new User({id: "123"});
      user.name = 'Bob';
      User.once('ajax response', function(res) {
        superagent.put = put;
        expect(res.body.name).to.be("Bobby");
        done();
      });
      user.save(function () {});
    });

    it('emits "ajax request" event', function(done) {
      var put = superagent.put;
      var superagentApi = {
        set:  function () { return this; },
        send: function () { return this; },
        end:  function(cb) { cb(null, {body: {name: "Bobby"}}); }
      };
      superagent.put = function(url) {
        return superagentApi;
      };

      var user = new User({id: "123"});
      user.name = 'Bob';
      User.once('ajax request', function(req) {
        superagent.put = put;
        expect(req).to.have.keys('set', 'send', 'end');
        done();
      });
      user.save(function () {});
    });
  });

  describe(".remove()", function() {
    it("does a DELETE request to the base url with the ID", function(done) {
      var del = superagent.del;
      var superagentApi = {
        set:  function () { return this; },
        send: function () { return this; },
        end:  function(cb) { cb(null, {}); }
      };
      superagent.del = function(url, cb) {
        expect(url).to.be('/users/123');
        return superagentApi;
      };

      var user = new User({id: "123"});
      user.remove(function() {
        superagent.del = del;
        done();
      });
    });

    it("sets header for request", function(done) {
      var del = superagent.del;
      var superagentApi = {
        set: function (header) {
          expect(header).to.have.property('Accept', 'application/json');
          return this;
        },
        send: function () { return this; },
        end:  function(cb) { cb(null, {}); }
      };
      superagent.del = function(url, cb) {
        expect(url).to.be('/users/123');
        return superagentApi;
      };

      var user = new User({id: "123"});
      user.remove(function() {
        superagent.del = del;
        done();
      });
    });

    it("passes along errors from superagent", function(done) {
      var del = superagent.del;
      var superagentApi = {
        set:  function () { return this; },
        send: function () { return this; },
        end:  function(cb) { cb(null, {error: true}); }
      };
      superagent.del = function(url, cb) {
        return superagentApi;
      };

      var user = new User({id: "123"});
      user.remove(function(err) {
        expect(err).to.be(true);
        superagent.del = del;
        done();
      });
    });

    it('emits "ajax response" event', function(done) {
      var del = superagent.del;
      var superagentApi = {
        set:  function () { return this; },
        send: function () { return this; },
        end:  function(cb) { cb(null, { status: 204 }); }
      };
      superagent.del = function(url, cb) {
        return superagentApi;
      };

      var user = new User({id: "123"});
      User.once('ajax response', function(res) {
        superagent.del = del;
        expect(res).to.have.property('status', 204);
        done();
      });
      user.remove(function() {});
    });

    it('emits "ajax request" event', function(done) {
      var del = superagent.del;
      var superagentApi = {
        set:  function () { return this; },
        send: function () { return this; },
        end:  function(cb) { cb(null, { status: 204 }); }
      };
      superagent.del = function(url, cb) {
        return superagentApi;
      };

      var user = new User({id: "123"});
      User.once('ajax request', function(req) {
        superagent.del = del;
        expect(req).to.have.keys('set', 'send', 'end');
        done();
      });
      user.remove(function() {});
    });

  });
});
