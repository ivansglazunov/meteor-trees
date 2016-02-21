// collection.inheritTree(Inherit: Mongo.Collection)
Mongo.Collection.prototype.inheritTree = function(Inherit) {
	var Tree = this;

	if (!(Tree._name in trees))
		throw new Meteor.Error('Collection '+Tree._name+' is not a tree.');
	if (!(Inherit._name in trees))
		throw new Meteor.Error('Collection '+Inherit._name+' is not a tree.');
	if (Inherit._name in trees[Tree._name].inherit)
		throw new Meteor.Error('Tree '+Inherit._name+' is already inherited in tree '+Tree._name+'.');

	trees[Tree._name].inherit[Inherit._name] = true;
	
	Tree.direct.find().observe({
		added: function(document) {
			var inherits = Inherit.direct.find({
				'_source.collection': document._target.collection,
				'_source.id': document._target.id
			});
			inherits.forEach(function (inherit) {
				var root = ('_inherit' in inherit)?inherit._inherit.root:inherit._id;
				if (!Inherit.direct.find({
					'_source.collection': document._source.collection,
					'_source.id': document._source.id,
					'_target.collection': inherit._target.collection,
					'_target.id': inherit._target.id,
					'_inherit.root': root,
					'_inherit.prev': inherit._id,
					'_inherit.path.collection': Tree._name,
					'_inherit.path.id': document._id
				}).count()) {
					Inherit.direct.insert({
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
			Inherit.direct.remove({
				'_inherit.path.collection': Tree._name,
				'_inherit.path.id': document._id
			});
		}
	});

	Inherit.direct.find().observe({
		added: function(document) {
			var paths = Tree.direct.find({
				'_target.collection': document._source.collection,
				'_target.id': document._source.id
			});
			paths.forEach(function(path) {
				if (!Inherit.direct.find({
					'_source.collection': path._source.collection,
					'_source.id': path._source.id,
					'_target.collection': document._target.collection,
					'_target.id': document._target.id,
					'_inherit.path.collection': Tree._name,
					'_inherit.path.id': path._id,
					$or: [
						{'_inherit.root': ('_inherit' in document)?document._inherit.root:document._id},
						{'_id': ('_inherit' in document)?document._inherit.root:document._id}
					]
				}).count()) {
					Inherit.direct.insert({
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
			Inherit.direct.remove({
				'_inherit.prev': document._id
			});
		}
	});
};