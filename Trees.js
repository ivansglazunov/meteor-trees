var trees = {};

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
				if (Tree.findOne(document._inherit.prev) && Refs(document._inherit))
					throw new Meteor.Error('You can not delete an inherited link if its base intact.');
			}
		}
	});

	Tree.helpers({
		source: function() {
			return Refs(Tree._source);
		},
		target: function() {
			return Refs(Tree._target);
		},
		remove: function() {
			return Tree.remove(Tree._inherit?Tree._inherit.root:Tree._id);
		}
	});
};

if (Meteor.isServer) {
	Mongo.Collection.prototype.inheritTree = function(Inherit) {
		var Tree = this;

		if (!(Tree._name in trees))
			throw new Meteor.Error('Collection '+Tree._name+' is not a tree.');
		if (!(Inherit._name in trees))
			throw new Meteor.Error('Collection '+Inherit._name+' is not a tree.');
		if (Inherit._name in trees[Tree._name].inherit)
			throw new Meteor.Error('Tree '+Inherit._name+' is already inherited in tree '+This._name+'.');

		trees[Tree._name].inherit[Inherit._name] = true;

		Tree.find().observe({
			added: function(document) {
				var inherits = Inherit.find({
					'_source.collection': document._target.collection,
					'_source.id': document._target.id
				});
				inherits.forEach(function (inherit) {
					var root = ('_inherit' in inherit)?inherit._inherit.root:inherit._id;
					if (!Inherit.find({
						'_source.collection': document._source.collection,
						'_source.id': document._source.id,
						'_target.collection': inherit._target.collection,
						'_target.id': inherit._target.id,
						'_inherit.root': root,
						'_inherit.prev': inherit._id,
						'_inherit.path.collection': Tree._name,
						'_inherit.path.id': document._id
					}).count()) {
						Inherit.insert({
							_source: document._source,
							_target: inherit._target,
							_inherit: {
								root: root,
								prev: inherit._id,
								path: {
									collection: Tree._name,
									id: document._id
								}
							}
						});
					}
				});
			},
			removed: function(document) {
				Inherit.remove({
					'_inherit.path.collection': Tree._name,
					'_inherit.path.id': document._id
				});
			}
		});

		Inherit.find().observe({
			added: function(document) {
				var paths = Tree.find({
					'_target.collection': document._source.collection,
					'_target.id': document._source.id
				});
				paths.forEach(function(path) {
					if (!Inherit.find({
						'_source.collection': path._source.collection,
						'_source.id': path._source.id,
						'_target.collection': document._target.collection,
						'_target.id': document._target.id,
						'_inherit.path.collection': Tree._name,
						'_inherit.path.id': path._id
					}).count()) {
						Inherit.insert({
							_source: path._source,
							_target: document._target,
							_inherit: {
								root: ('_inherit' in document)?document._inherit.root:document._id,
								prev: document._id,
								path: {
									collection: Tree._name,
									id: path._id
								}
							}
						});
					}
				});
			},
			removed: function(document) {
				Inherit.remove({
					'_inherit.prev': document._id
				});
			}
		});
	};
}