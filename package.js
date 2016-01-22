Package.describe({
  name: 'ivansglazunov:trees',
  version: '0.3.6',
  summary: 'The universal system of trees.',
  git: 'https://github.com/ivansglazunov/meteor-trees',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.1');
  api.use('mongo');
  api.use('ecmascript');
  api.use('random');
  api.use('dburles:mongo-collection-instances@0.3.4');
  api.use('stevezhu:lodash@3.10.1');
  api.use('ivansglazunov:links@0.1.3');
  api.use('aldeed:simple-schema@1.5.1');
  api.use('raix:eventemitter@0.1.3');
  api.addFiles('Trees.js');
  api.addFiles('Tree.js');
  api.addFiles('Observe.js');
  api.addFiles('Cursor.js');
  api.addFiles('Link.js');
  api.export('Trees');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('random');
  api.use('mongo');
  api.use('dburles:mongo-collection-instances@0.3.4');
  api.use('stevezhu:lodash@3.10.1');
  api.use('ivansglazunov:trees');
  api.use('ivansglazunov:links@0.1.3');
  api.use('dburles:collection-helpers@1.0.4');
  api.addFiles('tests.js');
});
