# dgeni-alive
Live docs on top of dgeni documentation generator

[ [FAQ](https://github.com/wingedfox/dgeni-alive/wiki/FAQ) ] [ [HowTo](https://github.com/wingedfox/dgeni-alive/wiki/HowTo) ]

## Motivation
`Dgeni-alive` documentation generator has been built after a long search for working one with AngularJS doc flavour.

1. [ngdocs](//github.com/idanush/ngdocs) ([grunt-ngdoc](//github.com/bevacqua/grunt-ngdoc), [grunt-ngdocs](//github.com/m7r/grunt-ngdocs), etc) - has no updates for a long time
2. [docular](//grunt-docular.com/) - has no activity as well
3. [generator-ngdoc](//github.com/Quramy/generator-ngdoc) - has no activity as well and forces to use Yeoman tools, is not suitable for CI
4. [sia](//github.com/boundstate/sia) - really good one, but it likes Gulp and does not provide standalone extensible generator

With dgeni-alive you can

1. Use docgen as grunt task and directly
2. Extend docgen like native Dgeni package
3. Configure web views
4. TBD: view live examples

Parts of code were taken from generator-ngdoc.

## Demo Projects
1. [angular-route-segment](http://wingedfox.github.io/dgeni-alive/docs/angular-route-segment/), [sources](https://github.com/wingedfox/angular-route-segment/blob/master/src/)
2. [angular-gettext](http://wingedfox.github.io/dgeni-alive/docs/angular-gettext/), [sources](https://github.com/wingedfox/angular-gettext/blob/master/src/)
3. TBD

## What's Done
1. Migrated to Angular 1.5
2. Added controller and factory templates
3. Added links to internal/external components and types to method params
4. Added api-index component to show title API page
5. Added @deprecated, @since and @access tags
6. Built-in docs server
7. Added Errors Reference
8. Added Search
9. Added @sortOrder tag
10. TBD

## How it works
1. Configure Dgeni package
2. Append custom processors/templates/filters/etc
3. Run dgeni generator
4. Serve built app with your favorite server
5. ...
6. Profit


## How to use
### Install
```
npm install dgeni-alive --save-dev
```

### API
```js
var docgen = require('../scr/docgen')();
docgen.package().config(function(log) {
    log.level = 'info';
})
.src(this.filesSrc);
.dest(this.data.dest);
.generate().then(function(){
  console.log("I'm done!");
});

```

### Grunt task
Load task
```js
grunt.loadNpmTasks('dgeni-alive');
```

Add section to your Gruntfile.js
```
"dgeni-alive": {
options: {
  // optional basePath for correct path calculation
  basePath: '',
  // optional dgeni packages
  packages: [
    'dgeni-packages/jsdoc',            // either names
    require('dgeni-packages/examples') // or packages
  ]
  // optional serve section for running local http server with live docs
  serve: {
    // the server port
    // can also be written as a function, e.g.
    port: 10000,
    // open the browser
    openBrowser: true // or command to run favorite browser
  }
},
api: {
  // product title
  title: 'My Docs',
  // product version
  version: '<%= pkg.version %>',
  // do not expand paths
  expand: false,
  // where to put docs
  dest: '/docs/',
  // where to look for sources
  // grunt globbing is supported
  src: [
    '/src/**/*.js',
    '!**/test/**/*.js'
  ],
  // Any paths that contain your overriden templates relative to the grunt file
  templatePaths: [
    'dgeniAliveTemplates'
  ]
}
```

## License
MIT
