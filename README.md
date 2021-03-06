# ~~Trees~~ DEPRECATED

```
meteor add ivansglazunov:trees
```

Oriented graph with maintaining of integrity and inheritance.

---

New version of trees as graphs: [shuttler:graphs](https://github.com/meteor-shuttler/graphs).

New version of trees.inherit as graph selection: [shuttler:selection](https://github.com/meteor-shuttler/selection).

---

## Example

Identifiers are replaced by simple numbers for easy reading.

```js
// Default SimpleSchema of Tree Link.
// Already applied in attachTree, but you can specify any more schemas.
new SimpleSchema({
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
});

A = new Mongo.Collection('A');
B = new Mongo.Collection('B');
C = new Mongo.Collection('C');

A.attachTree();
B.attachTree();

if (Meteor.isServer) A.inheritTree(B);

C.insert({ _id: '1' });
C.insert({ _id: '2' });
C.insert({ _id: '3' });
C.insert({ _id: '4' });
C.insert({ _id: '5' });

A.insert({ _id: '6', _source: C.findOne('2').Ref(), _target: C.findOne('1').Ref() });
A.insert({ _id: '7', _source: C.findOne('3').Ref(), _target: C.findOne('2').Ref() });
A.insert({ _id: '8', _source: C.findOne('4').Ref(), _target: C.findOne('3').Ref() });
A.insert({ _id: '9', _source: C.findOne('5').Ref(), _target: C.findOne('4').Ref() });

B.insert({ _id: '10', _source: C.findOne('1').Ref(), _target: C.findOne('1').Ref() });

console.log(A.find().fetch());
// {"_id":"6","_source":{"collection":"C","id":"2"},"_target":{"collection":"C","id":"1"}}
// {"_id":"7","_source":{"collection":"C","id":"3"},"_target":{"collection":"C","id":"2"}}
// {"_id":"8","_source":{"collection":"C","id":"4"},"_target":{"collection":"C","id":"3"}}
// {"_id":"9","_source":{"collection":"C","id":"5"},"_target":{"collection":"C","id":"4"}}

console.log(B.find().fetch());
// {"_id":"10","_source":{"collection":"C","id":"1"},"_target":{"collection":"C","id":"1"}}
// {"_id":"11","_source":{"collection":"C","id":"2"},"_target":{"collection":"C","id":"1"},"_inherit":{"root":"10","prev":"10","path":{"collection":"A","id":"6"}}}
// {"_id":"12","_source":{"collection":"C","id":"3"},"_target":{"collection":"C","id":"1"},"_inherit":{"root":"10","prev":"11","path":{"collection":"A","id":"7"}}}
// {"_id":"13","_source":{"collection":"C","id":"4"},"_target":{"collection":"C","id":"1"},"_inherit":{"root":"10","prev":"12","path":{"collection":"A","id":"8"}}}
// {"_id":"14","_source":{"collection":"C","id":"5"},"_target":{"collection":"C","id":"1"},"_inherit":{"root":"10","prev":"13","path":{"collection":"A","id":"9"}}}

console.log(C.find().fetch());
// {"_id":"1"}
// {"_id":"2"}
// {"_id":"3"}
// {"_id":"4"}
// {"_id":"5"}

A.remove("8");

console.log(A.find().fetch());
{"_id":"6","_source":{"collection":"C","id":"2"},"_target":{"collection":"C","id":"1"}}
{"_id":"7","_source":{"collection":"C","id":"3"},"_target":{"collection":"C","id":"2"}}
{"_id":"9","_source":{"collection":"C","id":"5"},"_target":{"collection":"C","id":"4"}}

console.log(B.find().fetch());
{"_id":"10","_source":{"collection":"C","id":"1"},"_target":{"collection":"C","id":"1"}}
{"_id":"11","_source":{"collection":"C","id":"2"},"_target":{"collection":"C","id":"1"},"_inherit":{"root":"10","prev":"10","path":{"collection":"A","id":"6"}}}
{"_id":"12","_source":{"collection":"C","id":"3"},"_target":{"collection":"C","id":"1"},"_inherit":{"root":"10","prev":"11","path":{"collection":"A","id":"7"}}}

A.update("7", { $set: { _source: C.findOne('2').Ref() } });
// update failed: Error: [Access denied.]
```

## Tasks

- [x] collection.attachTree();
- [x] tree.inheritTree(Inherit: Mongo.Collection)
- [x] tree.mirrorTreeTargetsToSourceField(Tree: Mongo.Collection, field: String)
- [x] tree.addLink(source: Document|Ref, target: Document|Ref, insert: Object, callback: Function) => id: String
- [x] tree.link(target: Document|Ref|(id: String), source: Document|Ref|(id: String), query: Object, options: Object) => Link|undefined
- [x] tree.links(target: Document|Ref|(id: String), source: Document|Ref|(id: String), query: Object, options: Object) => Cursor
- [x] tree.linksTo(target: Document|Ref|(id: String), query: Object, options: Object) => Cursor
- [x] tree.linksFrom(source: Document|Ref|(id: String), query: Object, options: Object) => Cursor
- [x] tree.linkTo(target: Document|Ref|(id: String), query: Object, options: Object) => Link|undefined
- [x] tree.linkFrom(source: Document|Ref|(id: String), query: Object, options: Object) => Link|undefined
- [x] tree.unlinkTo(target: Document|Ref|(id: String), query: Object, callback: Function) => Number
- [x] tree.unlinkFrom(source: Document|Ref|(id: String), query: Object, callback: Function) => Number

## Versions

### 1.1.9
* Return observers for direct clean data.

### 1.1.8
* `link` `links`

### 1.1.7
* Support for find links in tree by id without collection.

### 1.1.6
* `ivansglazunov:refs@0.1.0`

### 1.1.5
* Fixes and refactoring.
* `mirrorTargetsFromTree` to `mirrorTreeTargetsToSourceField`
* `addLink` `linksTo` `linkTo` `linksFrom` `linkTo` `unlinkTo` `unlinkFrom`

### 1.1.4
* Replacing cursor observers on `matb33:collection-hooks`.
* Fix many bags.
* Add server method `collection.mirrorTargetsFromTree(Tree: Mongo.Collection, field: String)`.

### 1.1.3
* Default SimpleSchema defined on tree attaching.

### 1.1.2
* Added `link.root()` helper.

### 1.1.1
* Fix this context in helpers.

### 1.1.0
* remove `Trees` and `Trees.Schema`
* simultaneous inheritance of only one tree
* new syntax of inheritance
* limits completely transferred to the scheme