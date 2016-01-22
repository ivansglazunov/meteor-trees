# Trees

```
meteor add ivansglazunov:trees ivansglazunov:dbrefs
```

### [Documentation](https://github.com/ivansglazunov/meteor-trees/wiki/0.3.1)

The universal system of trees.

* Trees as a universal way to represent a link between documents
* Bind documents from different collections
* Store in each link, the custom fields
* Each link in tree has a unique id
* Integrity is maintained at [.allow](http://docs.meteor.com/#/full/allow) and [.deny](http://docs.meteor.com/#/full/deny) collection methods
* Events in the tree attached to the cursor

### Schema of link in tree:
```js
{
  // Required fields
  _id: String,
  _link: Link,
  // Any custom fields
  x: 100,
  y: 200
}
```

As a reference to the document uses the package [ivansglazunov:links](https://github.com/ivansglazunov/meteor-links).
As a reference to the link in document uses `Trees.Link`.

## Sample

> Let's say we want to create a tree of comments.
> All our data are stored in a collection of "data".

### Create new tree

You can use the following method:
* `Trees.new(name: String) => Tree`

```js
var comments = Trees.new('comments');
```

Now you can use the following method:
* `Trees.get(name) => Tree`

> Congratulations! Now you have a tree. However, it is not yet connected to the collections.

### Connect to collections

In documents in the collections of the specified field is reserved.

```js
var Data = new Mongo.Collection('data');
Data.attachTree(comments, '_comments');
```

In this field restrictions for maintain the integrity:
* Always have to be `_id` field and `_link` field in link.
* It is forbidden to change the field `_id` and field `_link` in link.

For this to work, be sure to:
* Add to `collection.allow` or `collection.deny` methods `Trees.checkInsert(collection, document)` in `insert` and `Trees.checkUpdate(collection, modifier)` in `update`.
* remove the package `insecure`.

Now you can use the following methods:
* `Data.trees() => { field: Tree }|undefined`
* `comments.field(collection) => String`
* `comments.collections() => { field: Mongo.Collection }`
* `comments.insert(document: Document, link: Link, fields: {}) => _id: String`
* `comments.set(document: Document, link: Link, fields: Object) => count: Number`
* `comments.remove(document: Document, link: Link) => count: Number`
* `comments.links(document: Document) => [Object]`
* `comments.link(document: Document, id: String) => Object|undefined`
* `comments.index(document: Document, id: String) => Number|undefined`
* `comments.children(document: Document, handler: .call(document, query, collection, field))) => Trees.Cursor`
* `comments.find(handler: (query, collection, field)) => Trees.Cursor`

> Congratulations! You are now connected to your collection to the tree!

### Let's make three comments

```js
var a = Data.insert({ content: 'a' });

// Link management interface.
var b = Data.insert({ content: 'b' });
comments.insert(Data.findOne(b), { _link: Data.findOne(a).Link() });

// Manage links manually.
var c = Data.insert({ content: 'c', _comments: [{ _id: Random.id(), _link: Data.findOne(b).Link()}] });
```

> Congratulations! Now we have several documents in the tree.

### It is also possible to use the events in the tree

```js
// The new collection was used in the tree.
// (collection: Mongo.Collection, field: String)
comments.on('attach', function(collection, field) {});

var cursor = Data.find();
var observer = comments.observe(Data, cursor);

// Insert new link in document.
// (link: Object, document: Object)
observer.on('insert', function(link, document) {});
// Update document with link. Communication can be not changed, but the document is changed.
// (newLink: Object, newDocument: Object, oldLink: Object, oldDocument: Object)
observer.on('update', function(newLink, newDocument, oldLink, oldDocument) {});
// Remove link from document.
// (link: Object, document: Object)
observer.on('remove', function(link, document) {});
```

### Use the SimpleSchema!

The package is compatible with the [SimpleSchema](https://atmospherejs.com/aldeed/simple-schema).

```js
var DataCommentsSchema = new SimpleSchema({
  _comments: {
    type: [Trees.Schema],
    defaultValue: [],
    optional: true
  }
});
// Use in conjunction with existing schemas!
Data.attachSchema(new SimpleSchema([DataCommentsSchema]));
```

> Full documentation with all methods can be found at the link wiki: [Documentation](https://github.com/ivansglazunov/meteor-trees/wiki/0.3.1).

## Versions

#### 0.3.1
* rename `Trees.Observe` on `Trees.Observer`
* fix comments

#### 0.3.0
* replaced [ivansglazunov:dbrefs](https://github.com/ivansglazunov/meteor-dbrefs) on [ivansglazunov:links](https://github.com/ivansglazunov/meteor-links).
* added `tree.inherit` method
* added link to link in `Link.js`
* added `tree.children` and `tree.find`

#### 0.2.1
* fix `Tree.prototype.links`, now always returns an array
* removed unnecessary dependence
* added to the normal selector of removal

#### 0.2.2
* remove trash