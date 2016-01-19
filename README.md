# Trees

```
meteor add ivansglazunov:trees ivansglazunov:dbrefs
```

The universal system of trees.

* Trees as a universal way to represent a link between documents
* Bind documents from different collections
* Store in each link, the custom fields
* Each link in tree has a unique id
* Integrity is maintained at [.allow](http://docs.meteor.com/#/full/allow) and [.deny](http://docs.meteor.com/#/full/deny) collection methods
* Events in the tree attached to the cursor

### An schema of link in tree:
```js
{
  // Required fields
  _id: String,
  _ref: DBRef,
  // Any custom fields
  x: 100,
  y: 200
}
```

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
Data.attachDBRef();
comments.useCollection(Data, '_comments');
```

In this field restrictions for maintain the integrity:
* Always have to be `_id` field and `_ref` field in link.
* It is forbidden to change the field `_id` and field `_ref` in link.

For this to work, be sure to:
* Add to `collection.allow` or `collection.deny` methods `Trees.checkInsert(collection, document)` in `insert` and `Trees.checkUpdate(collection, modifier)` in `update`.
* remove the package `insecure`.

Now you can use the following methods:
* `Trees.fields(collection: Mongo.Collection) => { field: Tree }`
* `comments.field(collection) => _comments`
* `comments.collections() => { field: Mongo.Collection }`
* `comments.insert(document: Document|DBRef, fields: { _ref: DBRef }) => _id: String`
* `comments.set(document: Document|DBRef, id: String, fields: Object) => _id: String`
* `comments.remove(document: Document|DBRef, fields: Object) => Number`
* `comments.exists(document: Document|DBRef) => Boolean`
* `comments.links(document: Document) => [Link]`
* `comments.link(document: Document, id: String) => Link|undefined`
* `comments.index(document: Document, id: String) => Number|undefined`

> Congratulations! You are now connected to your collection to the tree!

### Let's make three comments

```js
var a = Data.insert({ content: 'a' });

// Link management interface.
var b = Data.insert({ content: 'b' });
comments.insert(Data.findOne(b), { _ref: Data.findOne(a).DBRef() });

// Manage links manually.
var c = Data.insert({ content: 'c', _comments: [{ _id: Random.id(), _ref: Data.findOne(b).DBRef() }] });
```

> Congratulations! Now we have several documents in the tree.

### It is also possible to use the events in the tree

```js
// The new collection was used in the tree.
comments.on('useCollection', function(collection, field) {});

var cursor = Data.find();
var observer = comments.observe(Data, cursor);

// Insert new link in document.
observer.on('insert', function(link, document) {});
// Update document with link. Communication can be not changed, but the document is changed.
observer.on('update', function(newLink, newDocument, oldLink, oldDocument) {});
// Remove link from document.
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

## Versions

#### 0.2.1
* fix `Tree.prototype.links`, now always returns an array
* removed unnecessary dependence
* added to the normal selector of removal

#### 0.2.2
* remove trash
