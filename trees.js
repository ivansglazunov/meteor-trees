Trees = {};

Trees.Schema = new SimpleSchema({
  _id: {
    type: String,
    autoValue: function() { if (!this.isSet) return Random.id(); }
  },
  dbref: {
    type: DBRef.Schema
  }
});

Trees.attachedCollections = function() {
  var result = [];
  for (var key in collections) result.push(Meteor.Collection.get(key));
  return result;
};

var getTreeKey = function(treeName) {
  if (!this._treeNames && !this._treeNames[treeName]) throw new Meteor.Error('Name '+freeName+' in collection '+this._name+' is not found.');
  return this._treeNames[treeName];
};

var getTreeName = function(treeKey) {
  if (!this._treeKeys && !this._treeKeys[treeKey]) throw new Meteor.Error('Key '+treeKey+' in collection '+this._name+' is not found.');
  return this._treeKeys[treeKey];
};

var findTree = function(treeName, query, options) {
  var cursors = {};
  for (var key in collections) {
    var query = {};
    cursors[key] = Meteor.Collection.get(key).find(query);
  }
  return cursors;
};

collections = {};

Meteor.Collection.prototype.attachTree = function(treeName, documentKey) {
  if (!lodash.isString(treeName)) throw new Meteor.Error('treeName must be a String');
  if (!lodash.isString(documentKey)) throw new Meteor.Error('documentKey must be a String');

  if (!this.hasOwnProperty('_treeKeys')) this._treeKeys = {};
  if (!this.hasOwnProperty('_treeNames')) this._treeNames = {};
  this._treeKeys[documentKey] = treeName;
  this._treeNames[treeName] = documentKey;

  if (!collections.hasOwnProperty(this._name)) collections[this._name] = true;

  var collection = this;

  collection.getTreeKey = getTreeKey;
  collection.getTreeName = getTreeName;

  collection.findTree = findTree;

  collection.helpers({
    inTree: function(treeName) {
      var document = collection.findOne({ _id: this._id });
      return (!!document && document[collection.getTreeKey(treeName)] && document[collection.getTreeKey(treeName)].length);
    },
    setTree: function(treeName, dbref) {
      var $push = {};
      $push[collection.getTreeKey(treeName)] = { _id: Random.id(), dbref: DBRef.new(dbref) };
      collection.update(this._id, { $push: $push });
      return $push[collection.getTreeKey(treeName)]._id;
    },
    getTree: function(treeName, id) {
      return lodash.find(collection.findOne({ _id: this._id })[collection.getTreeKey(treeName)], { _id: id });
    },
    goToTree: function(treeName, id) {
      return DBRef(this.getTree(treeName, id).dbref);
    },
    unsetTree: function(treeName, id) {
      var $pull = {};
      $pull[collection.getTreeKey(treeName)] = { _id: id };
      collection.update(this._id, { $pull: $pull });
    },
    findTree: function(collection, treeName, query, options) {
      var query = {};
      query[collection.getTreeKey(treeName)] = { dbref: this.DBRef() };
      return collection.find(query);
    }
  });
};
