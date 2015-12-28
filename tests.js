var generateCollection = function(name) {
  var Test = new Mongo.Collection(name);

  Test.attachDBRef();
  Test.attachTree('a', '_a');
  Test.attachSchema({
    _a: {
      type: [Trees.Schema],
      optional: true,
      defaultValue: []
    }
  });

  if (Meteor.isServer) Test.allow({
    insert: function () {
      return true;
    },
    update: function () {
      return true;
    },
    remove: function () {
      return true;
    }
  });

  return Test;
};

Tinytest.add('ivansglazunov:trees attach', function (assert) {
  var test = Random.id();
  var Test = generateCollection(test);
});

Tinytest.add('ivansglazunov:trees getTreeKey getTreeName', function (assert) {
  var test = Random.id();
  var Test = generateCollection(test);

  assert.equal('_a', Test.getTreeKey('a'));
  assert.equal('a', Test.getTreeName('_a'));
});

Tinytest.add('ivansglazunov:trees inTree setTree getTree goToTree unsetTree incrementTreeInCollection incrementTree', function (assert) {
  var test = Random.id();
  var Test = generateCollection(test);

  Test.remove('b');

  Test.insert({ _id: 'b' });
  var document = Test.findOne('b');
  assert.equal({ _id: 'b', _a: [] }, document);
  assert.isFalse(document.inTree('a'));
  var id = document.setTree('a', document.DBRef());
  assert.isTrue(lodash.isString(id));
  var document = Test.findOne('b');
  assert.isTrue(document.inTree('a'));
  var tree = document.getTree('a', id);
  assert.equal(tree._id, id);
  assert.equal(tree.index, 0);
  assert.equal(document, document.goToTree('a', id));
  assert.equal(document.incrementTreeInCollection(Test, 'a'), 1);
  assert.equal(document.incrementTree('a'), 1);
  document.unsetTree('a', id);
  var document = Test.findOne('b');
  assert.isFalse(document.inTree('a'));
  var document = Test.findOne('b');
  assert.equal(document._a.length, 0);
  assert.equal(document.incrementTreeInCollection(Test, 'a'), 0);
  assert.equal(document.incrementTree('a'), 0);
});
