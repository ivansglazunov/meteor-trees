trees = {};

var methods = {};

// tree.addLink(source: Document|Ref, target: Document|Ref, insert: Object, callback: Function) => id: String
methods.addLink = function(source, target, insert, callback) {
	var query = {
		_source: source.Ref?source.Ref():source,
		_target: target.Ref?target.Ref():target,
	};
	return this.insert(insert?lodash.merge(query, insert):query, callback);
};

// tree.links(source: Document|Ref|(id: String), target: Document|Ref|(id: String), query: Object, options: Object) => Cursor
methods.links = function(source, target, find, options) {
	var query = {};
	if (typeof(source) == 'object' && 'Ref' in source) {
		lodash.merge(query, source.Ref('_source'));
	} else if (typeof(source) == 'object' && 'id' in source && 'collection' in source) {
		lodash.merge(query, {'_source.collection':source.collection,'_source.id':source.id});
	} else if (typeof(source) == 'string') {
		lodash.merge(query, {'_source.id':source.id});
	} else throw new Meteor.Error('source: Document|Ref|(id: String)');
	if (typeof(target) == 'object' && 'Ref' in target) {
		lodash.merge(query, target.Ref('_target'));
	} else if (typeof(target) == 'object' && 'id' in target && 'collection' in target) {
		lodash.merge(query, {'_target.collection':target.collection,'_target.id':target.id});
	} else if (typeof(target) == 'string') {
		lodash.merge(query, {'_target.id':target.id});
	} else throw new Meteor.Error('target: Document|Ref|(id: String)');
	return this.find(find?lodash.merge(query, find):query, options);
};

// tree.link(source: Document|Ref|(id: String), target: Document|Ref|(id: String), query: Object, options: Object) => Link|undefined
methods.link = function(source, target, find, options) {
	var query = {};
	if (typeof(source) == 'object' && 'Ref' in source) {
		lodash.merge(query, source.Ref('_source'));
	} else if (typeof(source) == 'object' && 'id' in source && 'collection' in source) {
		lodash.merge(query, {'_source.collection':source.collection,'_source.id':source.id});
	} else if (typeof(source) == 'string') {
		lodash.merge(query, {'_source.id':source.id});
	} else throw new Meteor.Error('source: Document|Ref|(id: String)');
	if (typeof(target) == 'object' && 'Ref' in target) {
		lodash.merge(query, target.Ref('_target'));
	} else if (typeof(target) == 'object' && 'id' in target && 'collection' in target) {
		lodash.merge(query, {'_target.collection':target.collection,'_target.id':target.id});
	} else if (typeof(target) == 'string') {
		lodash.merge(query, {'_target.id':target.id});
	} else throw new Meteor.Error('target: Document|Ref|(id: String)');
	return this.findOne(find?lodash.merge(query, find):query, options);
};

// tree.linksTo(target: Document|Ref|(id: String), query: Object, options: Object) => Cursor
methods.linksTo = function(target, find, options) {
	if (typeof(target) == 'object' && 'Ref' in target) {
		var query = target.Ref('_target');
	} else if (typeof(target) == 'object' && 'id' in target && 'collection' in target) {
		var query = {'_target.collection':target.collection,'_target.id':target.id};
	} else if (typeof(target) == 'string') {
		var query = {'_target.id':target.id};
	} else throw new Meteor.Error('target: Document|Ref|(id: String)');
	return this.find(find?lodash.merge(query, find):query, options);
};

// tree.linksFrom(source: Document|Ref|(id: String), query: Object, options: Object) => Cursor
methods.linksFrom = function(source, find, options) {
	if (typeof(source) == 'object' && 'Ref' in source) {
		var query = source.Ref('_source');
	} else if (typeof(source) == 'object' && 'id' in source && 'collection' in source) {
		var query = {'_source.collection':source.collection,'_source.id':source.id};
	} else if (typeof(source) == 'string') {
		var query = {'_source.id':source.id};
	} else throw new Meteor.Error('source: Document|Ref|(id: String)');
	return this.find(find?lodash.merge(query, find):query, options);
};

// tree.linkTo(target: Document|Ref|(id: String), query: Object, options: Object) => Link|undefined
methods.linkTo = function(target, find, options) {
	if (typeof(target) == 'object' && 'Ref' in target) {
		var query = target.Ref('_target');
	} else if (typeof(target) == 'object' && 'id' in target && 'collection' in target) {
		var query = {'_target.collection':target.collection,'_target.id':target.id};
	} else if (typeof(target) == 'string') {
		var query = {'_target.id':target.id};
	} else throw new Meteor.Error('target: Document|Ref|(id: String)');
	return this.findOne(find?lodash.merge(query, find):query, options);
};

// tree.linkFrom(source: Document|Ref|(id: String), query: Object, options: Object) => Link|undefined
methods.linkFrom = function(source, find, options) {
	if (typeof(source) == 'object' && 'Ref' in source) {
		var query = source.Ref('_source');
	} else if (typeof(source) == 'object' && 'id' in source && 'collection' in source) {
		var query = {'_source.collection':source.collection,'_source.id':source.id};
	} else if (typeof(source) == 'string') {
		var query = {'_source.id':source.id};
	} else throw new Meteor.Error('source: Document|Ref|(id: String)');
	return this.findOne(find?lodash.merge(query, find):query, options);
};

// tree.unlinkTo(target: Document|Ref|(id: String), query: Object, callback: Function) => Number
methods.unlinkTo = function(target, find, callback) {
	if (typeof(target) == 'object' && 'Ref' in target) {
		var query = target.Ref('_target');
	} else if (typeof(target) == 'object' && 'id' in target && 'collection' in target) {
		var query = {'_target.collection':target.collection,'_target.id':target.id};
	} else if (typeof(target) == 'string') {
		var query = {'_target.id':target.id};
	} else throw new Meteor.Error('target: Document|Ref|(id: String)');
	return this.remove(find?lodash.merge(query, find):query, callback);
};

// tree.unlinkFrom(source: Document|Ref|(id: String), query: Object, callback: Function) => Number
methods.unlinkFrom = function(source, find, callback) {
	if (typeof(source) == 'object' && 'Ref' in source) {
		var query = source.Ref('_source');
	} else if (typeof(source) == 'object' && 'id' in source && 'collection' in source) {
		var query = {'_source.collection':source.collection,'_source.id':source.id};
	} else if (typeof(source) == 'string') {
		var query = {'_source.id':source.id};
	} else throw new Meteor.Error('source: Document|Ref|(id: String)');
	return this.remove(find?lodash.merge(query, find):query, callback);
};

Mongo.Collection.prototype.attachTree = function() {
	var Tree = this;

	if (Tree._name in trees)
		throw new Meteor.Error('Tree already attached to collection '+Tree._name+'.');
	trees[Tree._name] = { inherit: {} };

	Tree.deny({
		insert: function (userId, document) {
			if ('_inherit' in document) {
				if (!(document._inherit.path.collection in trees))
					throw new Meteor.Error('Collection '+document._inherit.path.collection+' is not a tree.');
				var path = Refs(document._inherit.path);
				if (!path || path._source.id != document._source.id || path._source.collection != document._source.collection)
					throw new Meteor.Error('Invalid path.');
				var prev = Tree.findOne(document._inherit.prev);
				if (!prev || prev._source.id != path._target.id || prev._source.collection != path._target.collection || prev._target.id != document._target.id || prev._target.collection != document._target.collection)
					throw new Meteor.Error('Invalid prev.');
			}
		},
		update: function (userId, document, fieldNames, modifier) {
			if (lodash.includes(fieldNames, '_source') || lodash.includes(fieldNames, '_target') || lodash.includes(fieldNames, '_inherit'))
				throw new Meteor.Error('Access denied.');
		},
		remove: function(userId, document) {
			if ('_inherit' in document) {
				if (Tree.findOne(document._inherit.prev))
					throw new Meteor.Error('You can not delete an inherited link if its base intact.');
			}
		}
	});

	Tree.helpers({
		source: function() {
			return Refs(this._source);
		},
		target: function() {
			return Refs(this._target);
		},
		remove: function() {
			return Tree.remove(this._inherit?this._inherit.root:this._id);
		},
		root: function() {
			return this._inherit?Tree.findOne(this._inherit.root):this._id;
		}
	});
	
	Tree.attachSchema(new SimpleSchema({
		_source: { type: Refs.Schema },
		_target: { type: Refs.Schema },
		_inherit: {
			type: new SimpleSchema({
				root: { type: String },
				path: { type: Refs.Schema },
				prev: { type: String }
			}),
			optional: true
		}
	}));
	
	lodash.merge(Tree, methods);
};