# Purpose

The main purpose of extensions is to reduce the complexity and interdependencies in the code. Extensions only communicate via APIs, so they do not add any complexity to the core except that required to implement the APIs.

# How to create an extension

It's easiest to copy the `helloWorld` extension and change the directory name.

# Writing end-to-end tests for extensions

Writing the tests is almost the same as in the core, typescript specific things and e2e helpers module are the only differences. Often stricter typescript compiler options are used for extensions, so you'll need to install `@types/jasmine` package. Ensure that `compile` npm script also compiles e2e tests which after compiling should end up in `extensions/extenstion-name/spec/dist`. See an example in `markForUser` extension. You can import e2e helpers from a local package `end-to-end-testing-helpers`.

# How extensions work

Extensions must be implemented as standalone ES6 modules. Every extension must export `activate` function which will receive a single argument enabling access to the extensions API.

Extension may export other functions to enable other extensions to call them. In order for one extension to be allowed to call functions of other extensions it must declare dependent extensions in its `package.json` as it's done in a `helloWorld` extension.

# How are extensions built and executed

* `setup-extensions` npm script reads `package.json` of every extension, installs its dependencies and runs a `compile` script for every extension.
* It then generates a file which imports all extensions.
* The generated file is imported, extensions iterated and `activate` method is executed for every extension.


# Styling

Extension specific styles can be added by creating a file in `extension-folder/src/index.css`. The classnames and ids are prefixed on build so extension styles don't conflict with main application styles. Due to prefixing, a `superdesk.utilities.CSS.getClass` has to be used to get the correct classname at runtime.

There's an npm task - "watch-css-from-extensions" for rebuilding extension styles on file change.