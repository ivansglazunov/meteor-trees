// collection.mirrorTreeTargetsToSourceField(Tree: Mongo.Collection, field: String)
Mongo.Collection.prototype.mirrorTreeTargetsToSourceField = function(Tree, field) {
	var Collection = this;
	
	if (!(Tree._name in trees))
		throw new Meteor.Error('Collection '+Tree._name+' is not a tree.');

	Tree.find({ '_source.collection': Collection._name }).observe({
		added: function(document) {
			var query = {};
			query._id = document._source.id;
			query[field] = { $elemMatch: { id: document._target.id, collection: document._target.collection }};
			if (!Collection.direct.find(query).count()) {
				var $push = {};
				$push[field] = document._target;
				Collection.direct.update(document._source.id, {
					$push: $push
				});
			}
		},
		removed: function(document) {
			var document = Tree._transform(document);
			var anotherEqualLinks = Tree.direct.find(lodash.merge(
				document.source().Ref('_source'),
				document.target().Ref('_target')
			));
			if (!anotherEqualLinks.count()) {
				var $pull = {};
				$pull[field] = document._target;
				Collection.direct.update(document._source.id, {
					$pull: $pull
				});
			}
		}
	});
};