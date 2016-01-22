// new Tree()
Tree = Trees.Tree = function(name) {
  if (name in _trees)
    throw new Meteor.Error('tree with name "'+name+'" already attached.');
  this._name = name;
};

// EventEmitter wrappers
Tree.prototype.on = function() { return _trees[this._name].events.on.apply(_trees[this._name].events, arguments); };
Tree.prototype.once = function() { return _trees[this._name].events.once.apply(_trees[this._name].events, arguments); };
Tree.prototype.off = function() { return _trees[this._name].events.off.apply(_trees[this._name].events, arguments); };
Tree.prototype.addListener = function() { return _trees[this._name].events.addListener.apply(_trees[this._name].events, arguments); };
Tree.prototype.removeListener = function() { return _trees[this._name].events.removeListener.apply(_trees[this._name].events, arguments); };

// Events
// attach(collection, field)

// Return field of tree in collection.
// (collection) => String
Tree.prototype.field = function(collection) {
  if (!(collection instanceof Mongo.Collection)) throw new Meteor.Error('collection is not a Mongo.Collection!');
  if (!(collection._name in _collections)) throw new Meteor.Error('collection "'+collection._name+'" is not defined in tree "'+this._name+'".');
  if (!(this._name in _collections[collection._name].trees)) throw new Meteor.Error('tree "'+this._name+'" is not used in collection "'+collection._name+'".');
  return _collections[collection._name].trees[this._name];
};

// Return collections used by tree.
// () => { field: Mongo.Collection }
Tree.prototype.collections = function() {
  var result = {};
  for (var name in _trees[this._name].collections)
    result[_collections[name].trees[this._name]] = _trees[this._name].collections[name];
  return result;
};

// Attach collection to tree.
// (tree: Tree, field: String)
Mongo.Collection.prototype.attachTree = function(tree, field) {
  var collection = this;
  
  collection.attachLinks();

  if (!(collection._name in _collections))
    _collections[collection._name] = { trees: {}, fields: {} };

  if (typeof(field) != 'string') throw new Meteor.Error('field must be a string');

  if (!(tree instanceof Tree)) throw new Meteor.Error('tree is not a Trees.Tree!');
  if (!(tree._name in _trees)) throw new Meteor.Error('tree with name "'+tree._name+'" is not defined.');

  if (field in _collections[collection._name].fields) throw new Meteor.Error('field "'+field+'" is already used in collection "'+collection._name+'.');
  if (collection._name in _trees[tree._name].collections) throw new Meteor.Error('collection "'+collection._name+'" is already used in tree "'+tree._name+'.');

  _collections[collection._name].trees[tree._name] = field;
  _collections[collection._name].fields[field] = tree;

  _trees[tree._name].collections[collection._name] = collection;

  _trees[tree._name].events.emit('attach', collection, field);
};

// Get document link index by id.
// (document: Document, id: String) => Number|undefined
Tree.prototype.index = function(document, id) {
  var link = document.Link();
  var field = this.field(Link.collection(link));
  for (var l in document[field])
    if (document[field][l]._id == id) return l;
  return undefined;
};

// Get document links.
// (document: Document) => [Link]
Tree.prototype.links = function(document) {
  var link = document.Link();
  var field = this.field(Link.collection(link));
  return (field in document) ? document[field] : [];
};

// Get document link by id.
// (document: Document, id: String) => Object
Tree.prototype.link = function(document, id) {
  var link = document.Link();
  var field = this.field(Link.collection(link));
  for (var l in document[field]) {
    if (document[field][l]._id == id) return document[field][l];
  }
};

// Insert link in this tree in document.
// (document: Document, link: Link, fields: Object) => id: String
Tree.prototype.insert = function(document, _link, fields) {
  var link = document.Link();
  var collection = Link.collection(link);
  if (typeof(fields) != 'object') var fields = {};
  if (typeof(_link) != 'string') throw new Meteor.Error('link is not defined');
  Link.parse(_link);
  fields._link = _link;
  fields._id = Random.id();
  var modifier = { $push: {} };
  var field = this.field(Link.collection(link));
  modifier.$push[field] = fields;
  collection.update(document._id, modifier);
  return fields._id;
};

// Set all fields in link in this tree in document.
// (document: Document, id: String, fields: Object) => Number
Tree.prototype.set = function(document, id, fields) {
  var link = document.Link();
  var collection = Link.collection(link);
  var index = this.index(document, id);
  var modifier = { $set: {} };
  var _field = this.field(collection);
  fields._id = document[_field][index]._id;
  fields._link = document[_field][index]._link;
  modifier.$set[_field+'.'+index] = fields;
  return collection.update(document._id, modifier);
};

// Remove link in this tree.
// (document: Document, id: String) => Number
Tree.prototype.remove = function(document, id) {
  if (typeof(id) != 'string') throw new Meteor.Error('id must be a string');
  var link = document.Link();
  var collection = Link.collection(link);
  var field = this.field(collection);
  var $pull = {};
  $pull[field] = { _id: id };
  return collection.update(document._id, { $pull: $pull });
};

// Find children of document
// (document: Document, handler: .call(document, query, collection, field)) => Trees.Cursor
Tree.prototype.children = function(document, handler) {
  var link = document.Link();
  var result = new Trees.Cursor();
  lodash.each(this.collections(), function(collection, field) {
    var query = {};
    query[field+'._link'] = link;
    if (lodash.isFunction(handler)) handler.call(document, query, collection, field);
    var cursor = collection.find(query);
    result._cursors.push({ cursor: cursor, collection: collection, field: field });
  });
  return result;
};

// Find in tree
// (handler: (query, collection, field)) => Trees.Cursor
Tree.prototype.find = function(handler) {
  var result = new Trees.Cursor();
  lodash.each(this.collections(), function(collection, field) {
    var query = {};
    if (lodash.isFunction(handler)) handler(query, collection, field);
    var cursor = collection.find(query);
    result._cursors.push({ cursor: cursor, collection: collection, field: field });
  });
  return result;
};

// Interface of inheritance.
// (inheritable: Tree)
Tree.prototype.inherit = function(inheritable) {
  var main = this; // Tree

  var observeMainCollection = function(collection, field) {
    var cursor = collection.find();
    var observer = main.observe(collection, cursor);

    // Insert document in main tree.
    // Check parents in main tree for exists inheritable tree links.
    observer.on('insert', function(link, document) {
      var links = inheritable.links(Link(link._link));
      for (var l in links) inheritable.insert(document, links[l]._link, { _inherit: link._link });
    });

    // Remove document from main tree.
    // Check children in main tree for non exists inheritable tree links.
    observer.on('remove', function(link, document) {
      var _document = Link(link._link);
      if (_document) {
        var links = inheritable.links(document);
        for (var l in links)
          inheritable.remove(document, links[l]._id);
      }
      else {
        var children = main.children(document);
        children.forEach(function(document, collection, field, cursor) {
          var links = inheritable.links(document);
          for (var l in links)
            inheritable.remove(document, links[l]._id);
        });
      }
    });
  };

  // Observe changes in main tree, in present and future collections.
  lodash.each(main.collections(), observeMainCollection);
  main.on('attach', observeMainCollection);

  // Watch on inhertiable tree and maintains integrity.
  var observeInheritableCollection = function(collection, field) {
    var cursor = collection.find();
    var observer = inheritable.observe(collection, cursor);
    
    // Insert document in inheritable tree.
    // Check children in main tree for exists inheritable tree links.
    observer.on('insert', function(link, document) {
      var children = main.children(document);
      children.forEach(function(child, collection, field, cursor) {
        inheritable.insert(child, link._link, { _inherit: document.Link() });
      });
    });

    // Remove document from inheritable tree.
    // Check children in main tree for non exists inheritable tree links.
    observer.on('remove', function(link, document) {
      var children = main.children(document);
      children.forEach(function(child, collection, field, cursor) {
        var links = inheritable.links(child);
        for (var l in links)
          inheritable.remove(child, links[l]._id);
      });
    });
  };

  // Observe changes in inheritable tree, in present and future collections.
  lodash.each(inheritable.collections(), observeInheritableCollection);
  inheritable.on('attach', observeInheritableCollection);
};