Trees = {};

// SimpleSchema
Trees.Schema = new SimpleSchema({
  _id: {
    type: String,
    autoValue: function() { if (!this.isSet) return Random.id(); }
  },
  _ref: {
    type: DBRef.Schema
  }
});

// { name: Tree }
_trees = {};

// { collectionName: { field: Tree } }
_fieldsInCollection = {};

// { treeName: { collectionName: Mongo.Collection } }
_collectionsInTree = {};

// { collectionName: { treeName: field } }
_treesInCollection = {};

// Return fields with trees used in collections.
// (collection: Mongo.Collection) => { field: Tree }
Trees.fields = function(collection) {
  if (!(collection instanceof Mongo.Collection)) throw new Meteor.Error('Collection is not a Mongo.Collection!');
  return lodash.clone(_fieldsInCollection[collection._name]);
};

// Create new tree.
// (name) => Tree
Trees.new = function(name) {
  var tree = new Trees.Tree(name); // Construct tree.
  if (name in _trees) throw new Meteor.Error('Tree with name "'+name+'" already attached.'); // CHeck name duplication.
  _trees[name] = tree; // Define tree.
  return tree;
};

// Get created tree by name.
// (name) => Tree
Trees.get = function(name) {
  if (name in _trees) return _trees[name];
  else return undefined;
};

// Validation of `.allow` and `.deny`.

// Should always be a reference and id.
// (collection: Mongo.Collection, document: Document) => throw new Meteor.Error
Trees.checkInsert = function(collection, document) {
  var _fields = this.fields(collection);
  for (var _field in _fields) {
    if (_field in document) {
      for (var l in document[_field]) {
        if (!('_id' in document[_field][l]) || typeof(document[_field][l]['_id']) != 'string') throw new Meteor.Error('In "'+_field+'" field at index "'+l+'", "_id" field is not found.');
        if (!('_ref' in document[_field][l]) || !DBRef.isDBRef(document[_field][l]['_ref'])) throw new Meteor.Error('In "'+_field+'" field at index "'+l+'", "_ref" field is not found.');
      }
    }
  }
};

// Should always be a reference and id.
// (collection: Mongo.Collection, modifier: Modifier) => throw new Meteor.Error
Trees.checkUpdate = function(collection, document, modifier) {
  var _fields = this.fields(collection);
  for (var m in modifier) {
    if (m.charAt(0) == '$') {
      for (var key in modifier[m]) {
        var path = key.split('.');
        if (path[0] in _fields) {
          if (path.length == 1) {
            if (m == '$push') {
              if ('$each' in modifier[m][key]) {
                for (var e of modifier[m][key]['$each']) {
                  if (!('_id' in modifier[m][key]['$each'][e])) throw new Meteor.Error('Modifier $push to "'+path[0]+'" field, is invalid.', 'Field "_id" is not found.');
                  if (!('_ref' in modifier[m][key]['$each'][e])) throw new Meteor.Error('Modifier $push to "'+path[0]+'" field, is invalid.', 'Field "_ref" field is not found.');
                }
              } else {
                if (!('_id' in modifier[m][key])) throw new Meteor.Error('Modifier $push to "'+path[0]+'" field, is invalid.', 'Field "_id" is not found.');
                if (!('_ref' in modifier[m][key])) throw new Meteor.Error('Modifier $push to "'+path[0]+'" field, is invalid.', 'Field "_ref" field is not found.');
              }
            } else if (m != '$pull') throw new Meteor.Error('Illegal modifier with tree field!');
          } else if (path.length == 2) {
            if (m == '$set') {
              if (!(path[0] in document) || !(path[1] in document[path[0]])) throw new Meteor.Error('In "'+_field+'" field at path "'+key+'", link with index "'+path[1]+'" is not found.');
              if (!('_id' in modifier[m][key])) throw new Meteor.Error('In "'+_field+'" field at path "'+key+'", "_id" field is not found.');
              if (document[path[0]][path[1]]._id != modifier[m][key]._id) throw new Meteor.Error('In "'+_field+'" field at path "'+key+'", "_id" field is not equal with original field.');
              if (!('_ref' in modifier[m][key])) throw new Meteor.Error('In "'+_field+'" field at path "'+key+'", "_ref field" field is not found.');
              if (document[path[0]][path[1]]._ref != modifier[m][key]._ref) throw new Meteor.Error('In "'+_field+'" field at path "'+key+'", "_id" field is not equal with original field.');
            } else if (m == '$unset') {
              if ('_id' in modifier[m][key] || '_ref' in modifier[m][key]) throw new Meteor.Error('It is forbidden to remove required keys!');
            } else throw new Meteor.Error('Forbidden modifier to tree links.');
          } else if (path.length == 3 && (path[2] == '_id' || path[2] == '_ref')) {
            throw new Meteor.Error('It is forbidden to remove required keys!');
          }
        }
      }
    } else {
      throw new Meteor.Error('It is forbidden the full document update.');
    }
  }
};
