Trees = {};

// SimpleSchema
Trees.Schema = new SimpleSchema({
  _id: {
    type: String,
    autoValue: function() { if (!this.isSet) return Random.id(); }
  },
  _link: {
    type: String,
    custom: function () {
      Link.parse(this.value);
    }
  }
});

// { name: { trees: { name: field }, fields: { field: Trees.Tree } } }
_collections = {};

/* Handler: {
insert?: .call({ action: "insert"|"update" }, userId: any, collection: Mongo.Collection, link: Object, document: Document),
update?: .call({ action: "update" }, userId: any, collection: Mongo.Collection, link: Object, document: Document, fields: [String], modifier: Modifier),
remove?: .call({ action: "update"|"remove" }, userId: any, collection: Mongo.Collection, link: Object, document: Document, fields: [String], modifier: Modifier)
} */
var _handler = { insert: undefined, update: undefined, remove: undefined };

// { name: { collections: { name: Collection }, tree: Trees.Tree, events: EventEmitter }, handler: Handler }
_trees = {};

// Return fields with trees used in collection.
// () => { field: Trees.Tree }|undefined
Mongo.Collection.prototype.trees = function() {
  if (_collections[this._name])
    return lodash.clone(_collections[this._name].fields);
  return undefined;
};

// Create new tree.
// (name: String, handler: Handler) => Trees.Tree|thrown Meteor.Error
Trees.new = function(name, handler) {
  var tree = new Trees.Tree(name);
  if (name in _trees)
    throw new Meteor.Error('tree with name "'+name+'" already attached.');
  _trees[name] = { collections: {}, tree: tree, events: new EventEmitter(), handler: lodash.merge({}, _handler, handler) };
  return tree;
};

// Get created tree by name.
// (name: String) => Trees.Tree|undefined
Trees.get = function(name) {
  if (name in _trees)
    return _trees[name].tree;
  else return undefined;
};

// Validation of `.allow` and `.deny`.

// (userId: any, collection: Mongo.Collection, document: Document) => throw new Meteor.Error
Trees.checkInsert = function(userId, collection, document) {
  var _fields = collection.trees();
  for (var _field in _fields) {
    if (_field in document) {
      for (var l in document[_field]) {
        if (typeof(document[_field][l]['_id']) != 'string')
          throw new Meteor.Error('_id must be a string', 'document["'+_field+'"]["'+l+'"]');
        if (!Link.parse(document[_field][l]['_link']))
          throw new Meteor.Error('_link must be a string', 'document["'+_field+'"]["'+l+'"]');
        if ('_inherit' in document[_field][l])
          throw new Meteor.Error('_inherit in insert is forbidden', 'document["'+_field+'"]["'+l+'"]');
        if (_trees[_fields[_field]._name].handler.insert) {
          if (!_trees[_fields[_field]._name].handler.insert.call({ action: 'insert' }, userId, collection, document[_field][l], document))
            throw new Meteor.Error('access denied', 'you can not insert the link "'+document[_field][l]._id+'"');
        }
      }
    }
  }
};

var hasInheritanceParent = function(_field, link) {
  try {
    var inherit = Parse.Link(link._inherit);
  } catch(error) {
    throw new Meteor.Error('illigal "_inherit" field!');
  }
  if (inherit.link && inherit.link._link == link._link)
    return true;
  throw new Meteor.Error('illigal "_inherit" field!');
};

// (userId: any, collection: Mongo.Collection, document: Document, fields: [String], modifier: Modifier) => throw new Meteor.Error
Trees.checkUpdate = function(userId, collection, document, fields, modifier) {
  var _fields = collection.trees();
  for (var m in modifier) {
    if (m.charAt(0) == '$') {
      for (var field in modifier[m]) {
        var path = field.split('.');
        if (path[0] in _fields) {
          var tree = collection.trees()[path[0]];
          if (path.length == 1) {
            if (m == '$push') {
              if ('$each' in modifier[m][field]) {
                for (var e of modifier[m][field]['$each']) {
                  if (typeof(modifier[m][field]['$each'][e]['_id']) != 'string')
                    throw new Meteor.Error('_id must be a string', 'document["'+_field+'"].$');
                  if (typeof(modifier[m][field]['$each'][e]['_link']) != 'string')
                    throw new Meteor.Error('_link must be a string', 'document["'+path[0]+'"].$');
                  if ('_inherit' in modifier[m][field]['$each'][e])
                    hasInheritanceParent(path[0], modifier[m][field]['$each'][e]);
                  if (_trees[tree._name].handler.insert) {
                    if (!_trees[tree._name].handler.insert.call({ action: 'update' }, userId, collection, modifier[m][field]['$each'][e], document, fields, modifier))
                      throw new Meteor.Error('access denied', 'you can not insert this link in the document "'+document._id+'"');
                  }
                }
              } else {
                if (typeof(modifier[m][field]['_id']) != 'string')
                  throw new Meteor.Error('_id must be a string', 'document["'+_field+'"].$');
                if (typeof(modifier[m][field]['_link']) != 'string')
                  throw new Meteor.Error('_link must be a string', 'document["'+_field+'"].$');
                if ('_inherit' in modifier[m][field])
                  hasInheritanceParent(path[0], modifier[m][field]);
                if (_trees[tree._name].handler.insert) {
                  if (!_trees[tree._name].handler.insert.call({ action: 'update' }, userId, collection, modifier[m][field], document, fields, modifier))
                    throw new Meteor.Error('access denied', 'you can not insert this link in the document "'+document._id+'"');
                }
              }
            } else if (m == '$pull') {
              if (lodash.size(modifier[m][field]) > 1 || typeof(modifier[m][field]['_id']) != 'string')
                throw new Meteor.Error('remove link only by _id');
              else {
                var link = tree.link(document, modifier[m][field]['_id']);
                if (!link)
                  throw new Meteor.Error('link "'+modifier[m][field]['_id']+'" in document "'+document._id+'" not found');
                if ('_inherit' in link) {
                  var inherit = Trees.Link(link._inherit);
                  if (inherit.link && inherit.link._link == link._link)
                    throw new Meteor.Error('invalid removal operation with inherited link');
                }
                if (_trees[tree._name].handler.remove) {
                  if (!_trees[tree._name].handler.remove.call({ action: 'update' }, userId, collection, link, document, fields, modifier))
                    throw new Meteor.Error('access denied', 'you can not remove the link "'+link._id+'" in the document "'+document._id+'"');
                }
              }
            } else throw new Meteor.Error('illegal modifier with tree field!');
          } else if (path.length > 1) {
            if (m == '$set') {
              if (!(path[0] in document) || !(path[1] in document[path[0]]))
                throw new Meteor.Error('link not found', 'document["'+path[0]+'"]');

              if (path.length == 2) {
                if (typeof(modifier[m][field]['_id']) != 'string')
                  throw new Meteor.Error('_id must be a string', 'document["'+path[0]+'"]["'+path[1]+'"]');
                if (document[path[0]][path[1]]._id != modifier[m][field]._id)
                  throw new Meteor.Error('_id can not be changed', 'document["'+path[0]+'"]["'+path[1]+'"]');

                if (typeof(modifier[m][field]['_link']) != 'string')
                  throw new Meteor.Error('_link must be a string', 'document["'+path[0]+'"]["'+path[1]+'"]');
                if (document[path[0]][path[1]]._link != modifier[m][field]._link)
                  throw new Meteor.Error('_link can not be changed', 'document["'+path[0]+'"]["'+path[1]+'"]');

                if (document[path[0]][path[1]]._inherit) {
                  if (!('_inherit' in modifier[m][field]))
                    throw new Meteor.Error('_inherit not found', 'document["'+path[0]+'"]["'+path[1]+'"]');
                  if (document[path[0]][path[1]]._inherit != modifier[m][field]._inherit)
                    throw new Meteor.Error('_inherit can not be changed', 'document["'+path[0]+'"]["'+path[1]+'"]');
                } else if ('_inherit' in modifier[m][field])
                  throw new Meteor.Error('_inherit can not be changed');
              }

              if (_trees[tree._name].handler.update) {
                if (!_trees[tree._name].handler.update.call({ action: 'update' }, userId, collection, fields, modifier[m][field], document, fields, modifier))
                  throw new Meteor.Error('access denied', 'you can not update the link "'+modifier[m][field]['_id']+'" in the document "'+document._id+'"');
              }
            } else if (m == '$unset') {
              if (path.length == 2) {
                if ('_id' in modifier[m][field] || '_link' in modifier[m][field] || '_inherit' in modifier[m][field])
                  throw new Meteor.Error('required keys can not be changed');
              }
            } else
              throw new Meteor.Error('"'+m+'" is forbidden modifier to tree links.');
          } else if ((path.length == 3) && (path[2] == '_id' || path[2] == '_link' || path[2] == '_inherit')) {
            throw new Meteor.Error('required keys can not be changed');
          }
        }
      }
    } else {
      throw new Meteor.Error('it is forbidden the full document update.');
    }
  }
};

// (userId: any, collection: Mongo.Collection, document: Document) => throw new Meteor.Error
Trees.checkRemove = function(userId, collection, document) {
  var _fields = collection.trees();
  for (var _field in _fields) {
    if (_trees[_fields[_field]._name].handler.remove) {
      if (_field in document) {
        for (var l in document[_field]) {
          if (!_trees[_fields[_field]._name].handler.remove.call({ action: 'remove' }, userId, collection, document[_field][l], document))
            throw new Meteor.Error('access denied', 'you can not remove the link "'+document[_field][l]._id+'" in the document "'+document._id+'"');
        }
      }
    }
  }
};