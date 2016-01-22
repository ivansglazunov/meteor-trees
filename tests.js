var Checks = new Mongo.Collection('checks');
Checks.attachLinks();

Checks.allow({
  insert: function (userId, document) {
    return true;
  },
  update: function (userId, document, fields, modifier) {
    return true;
  },
  remove: function () {
    return true;
  }
});

var checks = Trees.new('checks', {
  insert: function(userId) { if (userId == 'devil') return false; return true; },
  update: function(userId) { if (userId == 'devil') return false; return true; },
  remove: function(userId) { if (userId == 'devil') return false; return true; }
});
var inheritable = Trees.new('inheritable');

var events = {
  attach: false,
  insert: false, update: false, remove: false
};

checks.on('attach', function() { events.attach = true; });

Checks.attachTree(checks, '_checks');
Checks.attachTree(inheritable, '_inheritable');

if (Meteor.isServer) checks.inherit(inheritable);

var observer = checks.observe(Checks, Checks.find());
observer.on('insert', function() { events.insert = true; });
observer.on('update', function() { events.update = true; });
observer.on('remove', function() { events.remove = true; });

Tinytest.add('ivansglazunov:trees checks insert', function (assert) {
  assert.throws(function() {
    Trees.checkInsert('devil', Checks, {
      _id: Random.id(), _checks: [{ _id: Random.id(), _link: "test|checks" }]
    });
  });
  assert.throws(function() {
    Trees.checkInsert(Random.id(), Checks, {
      _id: Random.id(), _checks: [{ _id: Random.id() }]
    });
  });
  Trees.checkInsert(Random.id(), Checks, {
    _id: Random.id(), _checks: [{ _id: Random.id(), _link: "test|checks" }]
  });
});

Tinytest.add('ivansglazunov:trees checks update links', function (assert) {
  assert.throws(function() {
    Trees.checkUpdate(Random.id(), Checks, Checks._transform({}), [], {
      $set: { '_checks': [{ _id: Random.id(), _link: "test|checks" }] }
    });
  });
});

Tinytest.add('ivansglazunov:trees checks update link invalid', function (assert) {
  assert.throws(function() {
    Trees.checkUpdate(Random.id(), Checks, Checks._transform({}), [], {
      $set: { '_checks.0': { _id: Random.id(), _link: "test|checks" } }
    });
  });
});

Tinytest.add('ivansglazunov:trees checks update link valid', function (assert) {
  var document = { _checks: [{ _id: Random.id(), _link: "test|checks" }] };
  Trees.checkUpdate(Random.id(), Checks, Checks._transform(document), [], {
    $set: { '_checks.0': document._checks[0] }
  });
  assert.throws(function() {
    Trees.checkUpdate('devil', Checks, Checks._transform(document), [], {
      $set: { '_checks.0': document._checks[0] }
    });
  });
});

Tinytest.add('ivansglazunov:trees checks update link._id', function (assert) {
  assert.throws(function() {
    Trees.checkUpdate(Random.id(), Checks, Checks._transform({}), [], {
      $set: { '_checks.0._id': Random.id() }
    });
  });
});

Tinytest.add('ivansglazunov:trees checks update link._link', function (assert) {
  assert.throws(function() {
    Trees.checkUpdate(Random.id(), Checks, Checks._transform({}), [], {
      $set: { '_checks.0._link': Random.id() }
    });
  });
});

Tinytest.add('ivansglazunov:trees checks update link.x', function (assert) {
  Trees.checkUpdate(Random.id(), Checks, Checks._transform({ _checks: [ { x: 123 } ] }), [], {
    $set: { '_checks.0.x': Random.id() }
  });
  assert.throws(function() {
    Trees.checkUpdate('devil', Checks, Checks._transform({}), [], {
      $set: { '_checks.0.x': Random.id() }
    });
  });
});

Tinytest.add('ivansglazunov:trees checks update push', function (assert) {
  Trees.checkUpdate(Random.id(), Checks, Checks._transform({}), [], {
    $push: { '_checks': { _id: Random.id(), _link: "test|checks" } }
  });
  assert.throws(function() {
    Trees.checkUpdate('devil', Checks, Checks._transform({}), [], {
      $push: { '_checks': { _id: Random.id(), _link: "test|checks" } }
    });
  });
});

Tinytest.add('ivansglazunov:trees checks update pull', function (assert) {
  var id = Random.id();
  assert.throws(function() {
    Trees.checkUpdate(Random.id(), Checks, Checks._transform({}), [], {
      $pull: { '_checks': { _id: id } }
    });
  });
  Trees.checkUpdate(Random.id(), Checks, Checks._transform({ '_checks': [{ _id: id }] }), [], {
    $pull: { '_checks': { _id: id } }
  });
});

Tinytest.add('ivansglazunov:trees Trees.fields', function (assert) {
  assert.equal(Checks.trees(), { _checks: checks, _inheritable: inheritable });
});

Tinytest.add('ivansglazunov:trees Trees.get', function (assert) {
  assert.equal(Trees.get('checks'), checks);
});

Tinytest.add('ivansglazunov:trees Tree.field', function (assert) {
  assert.equal(checks.field(Checks), '_checks');
});

Tinytest.add('ivansglazunov:trees Tree.collections', function (assert) {
  var collections = checks.collections();
  assert.isTrue(lodash.size(collections) == 1);
  assert.isTrue(collections._checks == Checks);
});

var insertLinkId;

Tinytest.add('ivansglazunov:trees insert', function (assert) {
  Checks.remove('a');
  Checks.insert({ _id: 'a' });

  assert.throws(function() {
    checks.insert(Checks.findOne('a'), undefined, { x: 123 });
  });
  assert.throws(function() {
    checks.insert(Checks.findOne('a'));
  });
  insertLinkId = checks.insert(Checks.findOne('a'), Checks.findOne('a').Link(), { x: 123 });
});

var updateLinkId;
Tinytest.add('ivansglazunov:trees set', function (assert) {
  Checks.remove('b');
  updateLinkId = Random.id();
  Checks.insert({ _id: 'b', _checks: [{ _id: updateLinkId, _link: Checks.findOne('a').Link(), x: 123 }] });
  checks.set(Checks.findOne('b'), updateLinkId, { x: 456 });
  assert.equal(Checks.findOne('b')._checks[0].x, 456);
});

Tinytest.add('ivansglazunov:trees link links', function (assert) {
  assert.equal(checks.link(Checks.findOne('b'), updateLinkId)._id, updateLinkId);
  assert.length(checks.links(Checks.findOne('b')), 1);
  assert.equal(checks.links(Checks.findOne('b'))[0]._id, updateLinkId);
});

Tinytest.add('ivansglazunov:trees remove', function (assert) {
  Checks.remove('c');
  Checks.insert({ _id: 'c' });
  var removeLinkId = checks.insert(Checks.findOne('c'), Checks.findOne('c').Link());
  assert.length(Checks.findOne('c')._checks, 1);
  checks.remove(Checks.findOne('c'), removeLinkId);
  assert.length(Checks.findOne('c')._checks, 0);
});

Tinytest.add('ivansglazunov:trees events', function (assert) {
  assert.isTrue(events.attach);
  assert.isTrue(events.insert);
  assert.isTrue(events.update);
  assert.isTrue(events.remove);
});