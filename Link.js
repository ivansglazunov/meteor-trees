// link|tree|document|collection|database

// (link: String) => Document|undefined
Trees.Link = function(link) {
  var link = Trees.Link.parse(link);
  var result = {
    collection: Mongo.Collection.get(link[3]),
    document: undefined, tree: undefined, link: undefined
  };
  result.document = result.collection.findOne({ _id: link[2] });
  if (result.document) {
    result.tree = Trees.get(link[1]);
    if (result.tree) {
      result.link = result.tree.link(result.document, link[0]);
    }
  }
  return result;
}

// (link: String) => [String]|undefined
Trees.Link.parse = function(link) {
  if (typeof(link) != 'string') throw new Meteor.Error('Link must be a string!', 'typeof(link) != "string"');
  var link = link.split('|');
  if (link.length < 4 || link.length > 5) throw new Meteor.Error('Invalid link.', 'link.length < 4 || link.length > 5');
  if (!link[0].length || !link[1].length || !link[2].length || !link[3].length || (link.length == 4 && !link[4].length)) throw new Meteor.Error('Invalid link.', 'Too short strings.');
  if (!Mongo.Collection.get(link[3])) throw new Meteor.Error('Collection '+link[3]+' not found.');
  if (!Trees.get(link[1])) throw new Meteor.Error('Tree '+link[1]+' not found.');
  return link;
};

// (link: String) => Boolean
Trees.Link.validate = function(link) {
  try {
    Trees.Link.parse(link);
  } catch(error) {
    return false;
  }
  return true;
};

// (link: String) => Collection|undefined
Trees.Link.collection = function(link) {
  var link = Trees.Link.parse(link);
  return Mongo.Collection.get(link[3]);
};

// (link: String) => Tree|undefined
Trees.Link.tree = function(link) {
  var link = Trees.Link.parse(link);
  return Trees.get(link[1]);
};

// (link: String) => String|undefined
Trees.Link.document = function(link) {
  var link = Trees.Link.parse(link);
  var result = { collection: Mongo.Collection.get(link[3]) };
  return result.collection.findOne({ _id: link[2] });
};

// (link: String) => Object|undefined
Trees.Link.link = function(link) {
  var result = Trees.Link(link);
  return result.link;
};