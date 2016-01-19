// new Tree()
Tree = Trees.Tree = function(name) {
  this._name = name;
  this._events = new EventEmitter();
};

// EventEmitter wrappers
Tree.prototype.on = function() { return this._events.on.apply(this._events, arguments); };
Tree.prototype.once = function() { return this._events.once.apply(this._events, arguments); };
Tree.prototype.off = function() { return this._events.off.apply(this._events, arguments); };
Tree.prototype.addListener = function() { return this._events.addListener.apply(this._events, arguments); };
Tree.prototype.removeListener = function() { return this._events.removeListener.apply(this._events, arguments); };

// Events
// useCollection(collection, field)

// Return field of tree in collection.
// (collection) => String
Tree.prototype.field = function(collection) {
  if (!(collection instanceof Mongo.Collection)) throw new Meteor.Error('Collection is not a Mongo.Collection!');
  if (!(collection._name in _treesInCollection)) throw new Meteor.Error('Collection "'+collection._name+'" is not defined in tree "'+this._name+'".');
  if (!(this._name in _treesInCollection[collection._name])) throw new Meteor.Error('Tree "'+this._name+'" is not defined in collection "'+collection._name+'".');
  return _treesInCollection[collection._name][this._name];
};

// Each by attached collections to tree.
// () => { field: Mongo.Collection }
Tree.prototype.collections = function() {
  return lodash.clone(_collectionsInTree[this._name]);
};

// Attach collection to tree.
// (collection: Mongo.Collection, field: String)
Tree.prototype.useCollection = function(collection, field) {
  var tree = this;

  if (!(collection instanceof Mongo.Collection)) throw new Meteor.Error('Collection is not a Mongo.Collection!');
  if (!(this._name in _trees)) throw new Meteor.Error('Tree with name "'+name+'" is not defined.');

  if (!(collection._name in _fieldsInCollection)) _fieldsInCollection[collection._name] = {}; // Define collections.
  if (!(this._name in _collectionsInTree)) _collectionsInTree[this._name] = {}; // Define field.
  if (!(collection._name in _treesInCollection)) _treesInCollection[collection._name] = {}; // Define collections.

  if (field in _fieldsInCollection[collection._name]) throw new Meteor.Error('Field "'+field+'" is already used in collection "'+collection._name+'.');
  if (collection._name in _collectionsInTree[this._name]) throw new Meteor.Error('Collection "'+collection._name+'" is already used in tree "'+this._name+'.');

  _fieldsInCollection[collection._name][field] = this;
  _collectionsInTree[this._name][collection._name] = collection;
  _treesInCollection[collection._name][this._name] = field;

  tree._events.emit('useCollection', collection, field);
};

// Get document link index by id.
// (document: Document, id: String) => Number|undefined
Tree.prototype.index = function(document, id) {
  if (!('DBRef' in document)) throw new Meteor.Error('"DBRef" is not defined in document.','Please use package "ivansglazunov:DBRefs" with method "attachDBRef".');
  var dbref = document.DBRef();
  var field = this.field(Meteor.Collection.get(dbref));
  for (var l in document[field]) {
    if (document[field][l]._id == id) return l;
  }
};

// Get document links.
// (document: Document) => [Link]
Tree.prototype.links = function(document) {
  if (!('DBRef' in document)) throw new Meteor.Error('"DBRef" is not defined in document.','Please use package "ivansglazunov:DBRefs" with method "attachDBRef".');
  var dbref = document.DBRef();
  var field = this.field(Meteor.Collection.get(dbref));
  return document[field];
};

// Get document link by id.
// (document: Document, id: String) => Link
Tree.prototype.link = function(document, id) {
  if (!('DBRef' in document)) throw new Meteor.Error('"DBRef" is not defined in document.','Please use package "ivansglazunov:DBRefs" with method "attachDBRef".');
  var dbref = document.DBRef();
  var field = this.field(Meteor.Collection.get(dbref));
  for (var l in document[field]) {
    if (document[field][l]._id == id) return document[field][l];
  }
};

// Insert link in this tree in document.
// (document: Document|DBRef, fields: Object) => id: String
Tree.prototype.insert = function(document, fields) {
  if (DBRef.isDBRef(document)) {
    var dbref = DBRef.new(document);
  } else {
    if (!('DBRef' in document)) throw new Meteor.Error('"DBRef" is not defined in document.','Please use package "ivansglazunov:DBRefs" with method "attachDBRef".');
    var dbref = document.DBRef();
  }
  if (typeof(fields) != 'object') throw new Meteor.Error('Argument "fields" must be a object.');
  if (!('_ref' in fields)) throw new Meteor.Error('Reference in fields is not defined.');
  if (!DBRef.isQuery(fields._ref)) throw new Meteor.Error('In fields, "_ref" field is not a dbref query.');
  fields._id = Random.id();
  var modifier = { $push: {} };
  var field = this.field(Meteor.Collection.get(dbref));
  modifier.$push[field] = fields;
  Meteor.Collection.get(dbref).update(dbref.$id, modifier);
  return fields._id;
};

// Set all fields in link in this tree in document.
// (dbref: Document|DBRef, id: String, fields: Object) => Link
Tree.prototype.set = function(document, id, fields) {
  if (DBRef.isDBRef(document)) {
    var dbref = DBRef.new(document);
    var document = DBRef(dbref);
  } else {
    if (!('DBRef' in document)) throw new Meteor.Error('"DBRef" is not defined in document.','Please use package "ivansglazunov:DBRefs" with method "attachDBRef".');
    var dbref = document.DBRef();
  }
  var index = this.index(document, id);
  var modifier = { $set: {} };
  var _field = this.field(Meteor.Collection.get(dbref));
  var field = _field+'.'+index;
  fields._id = document[_field][index]._id;
  fields._ref = document[_field][index]._ref;
  modifier.$set[field] = fields;
  Meteor.Collection.get(dbref).update(dbref.$id, modifier);
};

// Remove link in this tree.
// (document: Document|DBRef, id: String)
Tree.prototype.remove = function(document, id) {
  if (DBRef.isDBRef(document)) {
    var dbref = DBRef.new(document);
    var document = DBRef(dbref);
  } else {
    if (!('DBRef' in document)) throw new Meteor.Error('"DBRef" is not defined in document.','Please use package "ivansglazunov:DBRefs" with method "attachDBRef".');
    var dbref = document.DBRef();
  }
  var index = this.index(document, id);
  var field = this.field(Meteor.Collection.get(dbref));
  var $pull = {};
  $pull[field] = { _id: id };
  Meteor.Collection.get(dbref).update(dbref.$id, { $pull: $pull });
};

// Checks whether the document in the tree.
// (document: Document|DBRef) => Boolean
Tree.prototype.exists = function(document) {
  if (DBRef.isDBRef(document)) {
    var dbref = DBRef.new(document);
    var document = DBRef(dbref);
  } else {
    if (!('DBRef' in document)) throw new Meteor.Error('"DBRef" is not defined in document.','Please use package "ivansglazunov:DBRefs" with method "attachDBRef".');
    var dbref = document.DBRef();
  }
  var field = this.field(Meteor.Collection.get(dbref));
  return (field in document && document[field].length > 0);
};
