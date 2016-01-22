// new (tree: Trees.Tree, collection: Mongo.Collection, cursor: Mongo.Cursor, field: String)
var Observer = Trees.Observer = function(tree, collecion, cursor, field) {
  var observer = this;

  if (!(this instanceof Observer)) throw new Meteor.Error('Only constructing allowed!');

  this._events = new EventEmitter();

  cursor.observe({
    added: function(doc) {
      if (field in doc && doc[field].length) {
        for (var i in doc[field]) {
          observer._events.emit('insert', doc[field][i], doc);
        }
      }
    },
    changed: function(newDoc, oldDoc) {
      var oldLinks = {};
      if (field in oldDoc && oldDoc[field].length) {
        for (var i in oldDoc[field]) {
          oldLinks[oldDoc[field][i]._id] = oldDoc[field][i];
        }
      }
      if (field in newDoc && newDoc[field].length) {
        for (var f in newDoc[field]) {
          if (newDoc[field][f]._id in oldLinks) {
            observer._events.emit('update', newDoc[field][f], newDoc, oldLinks[newDoc[field][f]._id], oldDoc);
            delete oldLinks[newDoc[field][f]._id];
          } else {
            observer._events.emit('insert', newDoc[field][f], newDoc);
          }
        }
      }
      for (var l in oldLinks) {
        observer._events.emit('remove', oldLinks[l], oldDoc);
      }
    },
    removed: function(doc) {
      if (field in doc && doc[field].length) {
        for (var i in doc[field]) {
          observer._events.emit('remove', doc[field][i], doc);
        }
      }
    }
  });
};

// EventEmitter wrappers
Observer.prototype.on = function() { return this._events.on.apply(this._events, arguments); };
Observer.prototype.once = function() { return this._events.once.apply(this._events, arguments); };
Observer.prototype.off = function() { return this._events.off.apply(this._events, arguments); };
Observer.prototype.addListener = function() { return this._events.addListener.apply(this._events, arguments); };
Observer.prototype.removeListener = function() { return this._events.removeListener.apply(this._events, arguments); };

// Events
// insert(link: Object, document: Document)
// update(newLink: Object, newDoc: Document, oldLink: Object, oldDoc: Document)
// remove(link: Object, document: Document)

// (collection: Mongo.Collection, cursor: Mongo.Cursor) => Trees.Observer
Trees.Tree.prototype.observe = function(collection, cursor) {
  if (!(this instanceof Tree)) throw new Meteor.Error('Only calling allowed!');
  // if (!(cursor instanceof Mongo.Cursor)) throw new Meteor.Error('Cursor is not a cursor.');
  // if (!(collection instanceof Mongo.Collection)) throw new Meteor.Error('Collection is not a collection.');
  var field = this.field(collection);
  return new Trees.Observer(this, collection, cursor, field);
};
