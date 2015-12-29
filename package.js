Package.describe({
  name: 'ivansglazunov:trees',
  version: '0.1.0',
  summary: 'Trees of documents.',
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
  api.use('ivansglazunov:dbrefs@0.1.2');
  api.use('aldeed:simple-schema@1.5.1');
  api.use('aldeed:collection2@2.7.0');
  api.use('dburles:collection-helpers@1.0.4');
  api.addFiles('trees.js');
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
  api.use('ivansglazunov:dbrefs@0.1.2');
  api.use('aldeed:collection2@2.7.0');
  api.addFiles('tests.js');
});
