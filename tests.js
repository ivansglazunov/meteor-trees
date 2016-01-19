var Checks = new Mongo.Collection('checks');
Checks.attachDBRef();

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

var checks = Trees.new('checks');

var events = {
  useCollection: false,
  insert: false, update: false, remove: false
};

checks.on('useCollection', function() { events.useCollection = true; });

checks.useCollection(Checks, '_checks');

var observer = checks.observe(Checks, Checks.find());
observer.on('insert', function() { events.insert = true; });
observer.on('update', function() { events.update = true; });
observer.on('remove', function() { events.remove = true; });

Tinytest.add('ivansglazunov:trees checks insert', function (assert) {
  assert.throws(function() {
    Trees.checkInsert(Checks, {
      _id: Random.id(), _checks: [{ _id: Random.id() }]
    });
  });
  Trees.checkInsert(Checks, {
    _id: Random.id(), _checks: [{ _id: Random.id(), _ref: DBRef.new(Random.id(), Random.id()) }]
  });
});

Tinytest.add('ivansglazunov:trees checks update links', function (assert) {
  assert.throws(function() {
    Trees.checkUpdate(Checks, {}, {
      $set: { '_checks': [{ _id: Random.id(), _ref: DBRef.new(Random.id(), Random.id()) }] }
    });
  });
});

Tinytest.add('ivansglazunov:trees checks update link invalid', function (assert) {
  assert.throws(function() {
    Trees.checkUpdate(Checks, {}, {
      $set: { '_checks.0': { _id: Random.id(), _ref: DBRef.new(Random.id(), Random.id()) } }
    });
  });
});

Tinytest.add('ivansglazunov:trees checks update link valid', function (assert) {
  var document = { _checks: [{ _id: Random.id(), _ref: DBRef.new(Random.id(), Random.id()) }] };
  Trees.checkUpdate(Checks, document, {
    $set: { '_checks.0': document._checks[0] }
  });
});

Tinytest.add('ivansglazunov:trees checks update link._id', function (assert) {
  assert.throws(function() {
    Trees.checkUpdate(Checks, {}, {
      $set: { '_checks.0._id': Random.id() }
    });
  });
});

Tinytest.add('ivansglazunov:trees checks update link._ref', function (assert) {
  assert.throws(function() {
    Trees.checkUpdate(Checks, {}, {
      $set: { '_checks.0._ref': Random.id() }
    });
  });
});

Tinytest.add('ivansglazunov:trees checks update link.x', function (assert) {
  Trees.checkUpdate(Checks, {}, {
    $set: { '_checks.0.x': Random.id() }
  });
});

Tinytest.add('ivansglazunov:trees checks update push', function (assert) {
  Trees.checkUpdate(Checks, {}, {
    $push: { '_checks': { _id: Random.id(), _ref: DBRef.new(Random.id(), Random.id()) } }
  });
});

Tinytest.add('ivansglazunov:trees checks update pull', function (assert) {
  Trees.checkUpdate(Checks, {}, {
    $pull: { '_checks': { _id: Random.id() } }
  });
});

Tinytest.add('ivansglazunov:trees Trees.fields', function (assert) {
  assert.equal(Trees.fields(Checks), { _checks: checks });
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
  assert.isTrue(collections.checks == Checks);
});

var insertLinkId;

Tinytest.add('ivansglazunov:trees insert', function (assert) {
  Checks.remove('a');
  Checks.insert({ _id: 'a' });

  assert.throws(function() {
    checks.insert(Checks.findOne('a'), { x: 123 });
  });
  assert.throws(function() {
    checks.insert(Checks.findOne('a'));
  });
  insertLinkId = checks.insert(Checks.findOne('a'), { _ref: Checks.findOne('a').DBRef(), x: 123 });
});

var updateLinkId;
Tinytest.add('ivansglazunov:trees set', function (assert) {
  Checks.remove('b');
  updateLinkId = Random.id();
  Checks.insert({ _id: 'b', _checks: [{ _id: updateLinkId, _ref: Checks.findOne('a').DBRef(), x: 123 }] });
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
  var removeLinkId = checks.insert(Checks.findOne('c'), { _ref: Checks.findOne('c').DBRef() });
  assert.length(Checks.findOne('c')._checks, 1);
  checks.remove(Checks.findOne('c'), removeLinkId);
  assert.length(Checks.findOne('c')._checks, 0);
});

Tinytest.add('ivansglazunov:trees events', function (assert) {
  assert.isTrue(events.useCollection);
  assert.isTrue(events.insert);
  assert.isTrue(events.update);
  assert.isTrue(events.remove);
});
