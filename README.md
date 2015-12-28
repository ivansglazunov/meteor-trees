# Trees

```
meteor add ivansglazunov:trees
```

### Attach tree to collection

`collection.attachTree(treeName: String, documentKey: String)`

Attention! Always use `attachTree` and` attachDBRef` for each collection of participating in the trees!

```js
var Test = new Meteor.Collection('test');
Test.attachDBRef();
Test.attachTree('a','_a');
```

### `SimpleSchema` support

It is not necessary, but it is convenient.

```js
Test.attachSchema({
  _a: {
    // Required settings
    type: [Trees.Schema],
    optional: true,
    defaultValue: [],
    // You can limit participation in the trees within collection
    min: 0, max: 3
  }
});
```

### Methods of collection

* `collection.getTreeKey(treeName: String) => String`
* `collection.getTreeName(treeKey: String) => String`

### Methods of document in tree

* `document.inTree(treeName: String) => Boolean`
* `var id = document.setTree('a', document.DBRef()) => Boolean`
* `document.getTree(treeName: String, id: String) => Trees.Schema`
* `document.goToTree(treeName: String, id: String) => Document|undefined`
* `document.unsetTree(treeName: String, id)`
* `document.moveInTree(treeName: String, id: String, index: Number)`

```js
Test.insert({ _id: 'b' });
var document = Test.findOne('b');
// { _id: 'b', _a: [] }
document.inTree('a'); // false
var id = document.setTree('a', document.DBRef()); // "Jjwjg6gouWLXhMGKW"
var document = Test.findOne('b');
// { _id: 'b', _a: [{ _id: "Jjwjg6gouWLXhMGKW", dbref: DBRef, index: 0 }] }
document.inTree('a'); // true
document.getTree('a', 'Jjwjg6gouWLXhMGKW'); // { _id: "Jjwjg6gouWLXhMGKW", dbref: DBRef, index: 0 }
document.goToTree('a', 'Jjwjg6gouWLXhMGKW');
// { _id: 'b', _a: [{ _id: "Jjwjg6gouWLXhMGKW", dbref: DBRef, index: 0 }] }
document.moveInTree('a', 'Jjwjg6gouWLXhMGKW', 1);
document.getTree('a', 'Jjwjg6gouWLXhMGKW'); // { _id: "Jjwjg6gouWLXhMGKW", dbref: DBRef, index: 1 }
document.unsetTree('a', id);
var document = Test.findOne('b');
// { _id: 'b', _a: [] }
document.inTree('a'); // false
```

### Methods of documents in tree

* `document.findTree(collection: Collection, treeName: String, query?: Object, options?: Object) => Cursor`
* `document.incrementTreeInCollection(collection, treeName: String) => Number`
* `document.incrementTree(treeName: String) => Number`

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
{ _id: 'c', status: true, _a: [{ _id: "djwjg6gouWLXhFGKC", dbref: DBRef, index: 0 }] },
{ _id: 'e', _a: [{ _id: "wjwjs8EouWLXhFGTs", dbref: DBRef, index: 1 }] }
] */
b.findTree(Test, 'a', { status: true }).fetch();
/* [
{ _id: 'c', status: true, _a: [{ _id: "djwjg6gouWLXhFGKC", dbref: DBRef, index: 0 }] }
] */
b.incrementTree('a'); // 2
```


### Methods of trees

* `Trees.attachedCollections() => [Collection]`
