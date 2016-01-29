Package.describe({
  name: 'ivansglazunov:trees',
  version: '1.0.0',
  summary: 'Oriented graph.',
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
  api.use('ivansglazunov:refs@0.0.0');
  api.use('aldeed:simple-schema@1.5.1');
  api.use('raix:eventemitter@0.1.3');
  api.addFiles('Trees.js');
  api.export('Trees');
});