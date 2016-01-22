var Cursor = Trees.Cursor = function() {
  this._cursors = [];
};

// (callback(document, collection, field, cursor), thisArg)
Cursor.prototype.forEach = function(callback, thisArg) {
  var cursor = this;
  for (var c in this._cursors) {
    cursor._cursors[c].cursor.forEach(function(document) {
      callback(document, cursor._cursors[c].collection, cursor._cursors[c].field, cursor._cursors[c].cursor);
    }, thisArg);
  }
};

// (callback(document, collection, field, cursor), thisArg) => { collectionName: Array }
Cursor.prototype.map = function(callback, thisArg) {
  var result = {};
  for (var c in this._cursors) {
    result[this._cursors[c].collection._name] = this._cursors[c].cursor.map(function(document) {
      callback(document, this._cursors[c].collection, this._cursors[c].field, this._cursors[c].cursor);
    }, thisArg);
  }
  return result;
};

// () => { collectionName: Array }
Cursor.prototype.fetch = function() {
  var result = {};
  for (var c in this._cursors) {
    result[this._cursors[c].collection._name] = this._cursors[c].cursor.fetch();
  }
  return result;
};

// () => { collectionName: Number }
Cursor.prototype.count = function() {
  var result = {};
  for (var c in this._cursors) {
    result[this._cursors[c].collection._name] = this._cursors[c].cursor.count();
  }
  return result;
};