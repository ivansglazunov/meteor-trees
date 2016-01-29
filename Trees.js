Trees = {};

Trees.Schema = new SimpleSchema({
	_source: {
		type: new SimpleSchema({
			id: {
				type: String
			},
			collection: {
				type: String
			}
		})
	},
	_target: {
		type: new SimpleSchema({
			id: {
				type: String
			},
			collection: {
				type: String
			}
		})
	},
	_inherit: {
		type: new SimpleSchema({
			main: {
				type: String
			},
			inherit: {
				type: String
			},
			collection: {
				type: String
			},
			id: {
				type: String
			}
		}),
		optional: true
	}
});

var attachTreeSchema = new SimpleSchema({
	allowedSourceCollection: {
		type: [String],
		optional: true
	},
	allowedTargetCollection: {
		type: [String],
		optional: true
	},
	deniedSourceCollection: {
		type: [String],
		optional: true
	},
	denyTargetCollection: {
		type: [String],
		optional: true
	}
});

var trees = {};

Mongo.Collection.prototype.attachTree = function(options) {
	var This = this;

	if (This._name in trees)
		throw new Meteor.Error('Tree already attached to collection '+This._name+'.');

	trees[This._name] = true;

	var options = options?options:{};
	attachTreeSchema.clean(options);
	var context = attachTreeSchema.newContext();
	context.validate(options);

	This.deny({
		insert: function (userId, document) {
			if ('_inherit' in document) {

				if (!(document._inherit.collection in trees))
					throw new Meteor.Error('Collection '+document._inherit.collection+' is not a tree.');

				var path = Mongo.Collection.get(document._inherit.collection).findOne(document._inherit.id);

				if (!path)
					throw new Meteor.Error('Path of inheritance '+document._inherit.id+' is not found.');

				if (path._source._id != document._source._id)
					throw new Meteor.Error('Invalid source in path of inheritance.');

				var inherited = This.findOne({
					'_id': document._inherit.inherit,
					'_source.collection': path._target.collection,
					'_source.id': path._target.id,
					'_target.collection': document._target.collection,
					'_target.id': document._target.id
				});

				if (!inherited)
					throw new Meteor.Error('Invalid inheritance.');
			}
		},
		update: function (userId, document, fieldNames, modifier) {
			if (lodash.includes(fieldNames, '_source') || lodash.includes(fieldNames, '_target') || lodash.includes(fieldNames, '_inherit'))
				throw new Meteor.Error('Access denied.');
		},
		remove: function(userId, document) {
			if ('_inherit' in document) {
				if (This.findOne(document._inherit.inherit) && Refs(document._inherit))
					throw new Meteor.Error('You can not delete an inherited link if its base intact.');
			}
		}
	});

	if (options.allowedSourceCollection && options.allowedSourceCollection.length) {
		This.deny({
			insert: function (userId, document) {
				if (lodash.includes(options.allowedSourceCollection, document._source.collection))
					throw new Meteor.Error('Collection '+document._source.collection+' is not allowed.');
			}
		});
	}

	if (options.allowedTargetCollection && options.allowedTargetCollection.length) {
		This.deny({
			insert: function (userId, document) {
				if (lodash.includes(options.allowedTargetCollection, document._target.collection))
					throw new Meteor.Error('Collection '+document._target.collection+' is not allowed.');
			}
		});
	}

	if (options.deniedSourceCollection && options.deniedSourceCollection.length) {
		This.deny({
			insert: function (userId, document) {
				if (lodash.includes(options.deniedSourceCollection, document._source.collection))
					throw new Meteor.Error('Collection '+document._source.collection+' is denied.');
			}
		});
	}

	if (options.denyTargetCollection && options.denyTargetCollection.length) {
		This.deny({
			insert: function (userId, document) {
				if (lodash.includes(options.denyTargetCollection, document._target.collection))
					throw new Meteor.Error('Collection '+document._target.collection+' is denied.');
			}
		});
	}

	This.helpers({
		source: function() {
			return Refs(this._source);
		},
		target: function() {
			return Refs(this._target);
		}
	});
};

if (Meteor.isServer) {

	Mongo.Collection.prototype.inheritTree = function(Inherit) {
		var This = this;

		This.find().observe({
			added: function(document) {
				var inherits = Inherit.find({
					'_source.collection': document._target.collection,
					'_source.id': document._target.id
				});
				inherits.forEach(function (inherit) {
					var main = ('_inherit' in inherit)?inherit._inherit.main:inherit._id;
					if (!Inherit.find({
						'_source.collection': document._source.collection,
						'_source.id': document._source.id,
						'_target.collection': inherit._target.collection,
						'_target.id': inherit._target.id,
						'_inherit.main': main,
						'_inherit.inherit': inherit._id,
						'_inherit.collection': This._name,
						'_inherit.id': document._id
					}).count()) {
						Inherit.insert({
							_source: document._source,
							_target: inherit._target,
							_inherit: {
								main: main,
								inherit: inherit._id,
								collection: This._name,
								id: document._id
							}
						});
					}
				});
			},
			removed: function(document) {
				console.log(Inherit.findOne({
					'_inherit.collection': This._name,
					'_inherit.id': document._id
				}));
				Inherit.remove({
					'_inherit.collection': This._name,
					'_inherit.id': document._id
				});
			}
		});

		Inherit.find().observe({
			added: function(document) {
				var paths = This.find({
					'_target.collection': document._source.collection,
					'_target.id': document._source.id
				});
				paths.forEach(function(path) {
					if (!Inherit.find({
						'_source.collection': path._source.collection,
						'_source.id': path._source.id,
						'_target.collection': document._target.collection,
						'_target.id': document._target.id,
						'_inherit.collection': This._name,
						'_inherit.id': path._id
					}).count()) {
						Inherit.insert({
							_source: path._source,
							_target: document._target,
							_inherit: {
								main: ('_inherit' in document)?document._inherit.main:document._id,
								inherit: document._id,
								collection: This._name,
								id: path._id
							}
						});
					}
				});
			},
			removed: function(document) {
				Inherit.remove({
					'_inherit.inherit': document._id
				});
			}
		});
	};
}