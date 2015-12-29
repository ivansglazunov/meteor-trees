var generateCollection = function(name) {
  var Test = new Mongo.Collection(name);

  Test.attachDBRef();
  Test.attachTree('a', '_a');
  Test.attachSchema(new SimpleSchema([Test.getTreesSchema()]));

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

Tinytest.add('ivansglazunov:trees inTree setTree getTree goToTree unsetTree', function (assert) {
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
  assert.equal(document, document.goToTree('a', id));
  document.unsetTree('a', id);
  var document = Test.findOne('b');
  assert.isFalse(document.inTree('a'));
  var document = Test.findOne('b');
  assert.equal(document._a.length, 0);
});


Tinytest.add('ivansglazunov:trees SimpleSchema', function (assert) {
  var test = Random.id();
  var Test = new Mongo.Collection(test);

  Trees.defineCustomSchema('a', {
    type: [
      new SimpleSchema([
        // Be sure to add the standard scheme!
        Trees.Schema,
        // You can create your own custom fields
        new SimpleSchema({
          x0: { type: Number, optional: true, autoValue: function() { if (!this.isSet) return 0; } },
          x1: { type: Number, optional: true, autoValue: function() { if (!this.isSet) return 0; } },
          y0: { type: Number, optional: true, autoValue: function() { if (!this.isSet) return 0; } },
          y1: { type: Number, optional: true, autoValue: function() { if (!this.isSet) return 0; } }
        })
      ]),
    ],
    optional: true,
    defaultValue: []
  });

  Test.attachDBRef();
  Test.attachTree('a', '_a');
  Test.attachSchema(new SimpleSchema([Test.getTreesSchema()]));

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

  Test.insert({ _id: 'b' });
  var document = Test.findOne('b');
  var id = document.setTree('a', document.DBRef(), { y1: 100, x1: 100 });
  var document = Test.findOne('b');
  assert.equal(0, document._a[0].x0);
  assert.equal(0, document._a[0].y0);
  assert.equal(100, document._a[0].x1);
  assert.equal(100, document._a[0].y1);
});
