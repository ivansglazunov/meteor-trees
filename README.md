# Trees

```
meteor add ivansglazunov:trees
```

Give the name of the tree. Attach the tree to a specific key in the collection. Create trees of the documents in one or more collections!

## Model
```js
// document in your collection
{
  _id: 'a',
  // the key links in the tree - is always an array.
  _myTree: [
    {
      // each link has a unique id with meteor package "random"
      _id: Random.id(),
      // and a link to the parent DBRef tree with meteor package "ivansglazunov:dbrefs"
      dbref: DBRef
      // Also, there may be your custom fields defined for each tree.
      //  x0: 0, x1: 100,
      //  y0: 0, y1: 25
    }
  ]
}
```

### `SimpleSchema` support

#### Define tree

You can declare a tree special custom fields.
If you do not do this, it will use the standard description of tree link without any custom fields and constraints.
```js
Trees.defineCustomSchema('a', {
  type: [
    new SimpleSchema([
      // Be sure to add the standard scheme!
      Trees.Schema,
      // You can create your own custom fields
      new SimpleSchema({
        x0: { type: Number }, x1: { type: Number },
        y0: { type: Number }, y1: { type: Number }
      })
    ]),
  ],
  optional: true,
  defaultValue: [],
  // You can limit participation in the trees within collection
  min: 0, max: 3,
});
```
This method can be used only once for each collection.
To use defined custom fields is necessary to include in the scheme of trees to your collection!

#### Attach to collection

With `aldeed:simple-schema` you can pass multiple schemas to SimpleSchema.
You do not need to declare the scheme of keys in the collection of the trees alone! Just add `collection.treeSchema` to the your scheme.
If you have already used `collection.attachTree`, you can automatically receive the scheme of all the fields of trees.

```js
Test.attachSchema(new SimpleSchema([
  Test.getTreesSchema()
]));
```

### Attach tree to collection

`collection.attachTree(treeName: String, documentKey: String)`

Attention! Always use `attachTree` and` attachDBRef` for each collection of participating in the trees!

```js
var Test = new Meteor.Collection('test');
Test.attachDBRef();
Test.attachTree('a','_a');
```

### Methods of collection

* `collection.getTreeKey(treeName: String) => String`
* `collection.getTreeName(treeKey: String) => String`

### Methods of document in tree

* `document.inTree(treeName: String) => Boolean`
* `document.setTree(treeName: String, dbref: DBRef, customFields: Object) => Boolean`
* `document.getTree(treeName: String, id: String) => Object { _id: String, dbref: DBRef }`
* `document.goToTree(treeName: String, id: String) => Document|undefined`
* `document.unsetTree(treeName: String, id)`

```js
Test.insert({ _id: 'b' });
var document = Test.findOne('b');
// { _id: 'b', _a: [] }
document.inTree('a'); // false
var id = document.setTree('a', document.DBRef()); // "Jjwjg6gouWLXhMGKW"
var document = Test.findOne('b');
// { _id: 'b', _a: [{ _id: "Jjwjg6gouWLXhMGKW", dbref: DBRef }] }
document.inTree('a'); // true
document.getTree('a', 'Jjwjg6gouWLXhMGKW'); // { _id: "Jjwjg6gouWLXhMGKW", dbref: DBRef }
document.goToTree('a', 'Jjwjg6gouWLXhMGKW');
// { _id: 'b', _a: [{ _id: "Jjwjg6gouWLXhMGKW", dbref: DBRef }] }
document.getTree('a', 'Jjwjg6gouWLXhMGKW'); // { _id: "Jjwjg6gouWLXhMGKW", dbref: DBRef }
document.unsetTree('a', id);
var document = Test.findOne('b');
// { _id: 'b', _a: [] }
document.inTree('a'); // false
```

### Methods of documents in tree

* `document.findTree(collection: Collection, treeName: String, query?: Object, options?: Object) => Cursor`

```js
Test.insert({ _id: 'b' });
Test.insert({ _id: 'c', status: true });
Test.insert({ _id: 'e' });
var b = Test.findOne('b');
var c = Test.findOne('c');
var e = Test.findOne('e');
c.setTree('a', b.DBRef());
e.setTree('a', b.DBRef());
b.findTree(Test, 'a').fetch();
/* [
{ _id: 'c', status: true, _a: [{ _id: "djwjg6gouWLXhFGKC", dbref: DBRef }] },
{ _id: 'e', _a: [{ _id: "wjwjs8EouWLXhFGTs", dbref: DBRef }] }
] */
b.findTree(Test, 'a', { status: true }).fetch();
/* [
{ _id: 'c', status: true, _a: [{ _id: "djwjg6gouWLXhFGKC", dbref: DBRef }] }
] */
```


### Methods of trees

* `Trees.attachedCollections() => [Collection]`

# Versions

### 0.1.0

* Add support custom fields in tree SimpleSchema.
