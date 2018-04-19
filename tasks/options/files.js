
var path = require('path');
var root = path.dirname(path.dirname(__dirname));

exports.scripts = [
    '*.js',
    '<%= appDir %>/main.js',
    '<%= appDir %>/docs/**/*.js',
    path.join(root, 'spec/**/*.js'),
    path.join(root, 'tasks/**/*.js'),
    path.join(root, 'scripts/**/*.js'),
];
