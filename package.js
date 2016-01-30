Package.describe({
  name: 'ivansglazunov:trees',
  version: '1.1.0',
  summary: 'Oriented graph with maintaining of integrity and inheritance.',
  git: 'https://github.com/ivansglazunov/meteor-trees',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.1');
  api.use('mongo');
  api.use('ecmascript');
  api.use('random');
  api.use('dburles:mongo-collection-instances@0.3.5');
  api.use('stevezhu:lodash@4.0.0');
  api.use('ivansglazunov:refs@0.0.0');
  api.use('aldeed:simple-schema@1.5.3');
  api.use('raix:eventemitter@0.1.3');
  api.addFiles('Trees.js');
});