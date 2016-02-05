# Trees

```
meteor add ivansglazunov:trees
```

Oriented graph with maintaining of integrity and inheritance.

## Example

Identifiers are replaced by simple numbers for easy reading.

```js
// Default SimpleSchema of Tree Link. 
var Schema = new SimpleSchema({
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

A.attachSchema(Schema);
B.attachSchema(Schema);

A.attachRefs();
B.attachRefs();
C.attachRefs();

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

## Versions

### 1.1.2
* Added `link.root()` helper.

### 1.1.1
* Fix this context in helpers.

### 1.1.0
* remove `Trees` and `Trees.Schema`
* simultaneous inheritance of only one tree
* new syntax of inheritance
* limits completely transferred to the scheme