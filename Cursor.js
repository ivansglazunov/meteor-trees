// (cursor: Mongo.Cursor) => Trees.Observe
Tree.prototype.observe = function(cursor) {
  if (!(this instanceof Tree)) throw new Meteor.Error('Only calling allowed!');
  if (!(cursor instanceof Mongo.Cursor)) throw new Meteor.Error('Cursor is not a cursor.');
  this._events = new EventEmitter();

  var field = this.field(Meteor.Collection.get(dbref));

  cursor.observe({
    added: function(doc) {
      if (field in doc && doc[field].length) {
        for (var i in doc[field]) {
          tree._events.emit('insert', doc[field][i], doc);
        }
      }
    },
    changed: function(newDoc, oldDoc) {
      var oldLinks = {};
      if (field in oldDoc && oldDoc[field].length) {
        for (var i in oldDoc[field]) {
          oldLinks[oldDoc[field]._id] = oldDoc[field];
        }
      }
      if (field in newDoc && newDoc[field].length) {
        for (var f in newDoc[field]) {
          if (newDoc[field][f]._id in oldLinks) {
            tree._events.emit('update', newDoc[field][f], newDoc, oldLinks[newDoc[field][f]._id], oldDoc);
            delete oldLinks[newDoc[field][f]._id];
          } else {
            tree._events.emit('insert', newDoc[field][f], newDoc);
          }
        }
      }
      for (var l in oldLinks) {
        tree._events.emit('remove', oldLinks[l], oldDoc);
      }
    },
    removed: function(doc) {
      if (field in doc && doc[field].length) {
        for (var i in doc[field]) {
          tree._events.emit('remove', doc[field][i], doc);
        }
      }
    }
  });
};

// EventEmitter wrappers
Observe.prototype.on = function() { return this._events.on.apply(this._events, arguments); };
Observe.prototype.once = function() { return this._events.once.apply(this._events, arguments); };
Observe.prototype.off = function() { return this._events.off.apply(this._events, arguments); };
Observe.prototype.addListener = function() { return this._events.addListener.apply(this._events, arguments); };
Observe.prototype.removeListener = function() { return this._events.removeListener.apply(this._events, arguments); };

// Events
// useCollection(collection, field)
// insert(link, document)
// update(newLink, newDoc, oldLink, oldDoc)
// remove(link, document)
