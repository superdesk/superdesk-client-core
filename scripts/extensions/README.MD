# Purpose

The main purpose of extensions is to reduce the complexity and interdependencies in the code. Extensions only communicate via APIs, so they do not add any complexity to the core except that required to implement the APIs.

# How to create an extension

It's easiest to copy the `helloWorld` extension and change the directory name.

# How extensions work

Extensions must be implemented as standalone ES6 modules. Every extension must export `activate` function which will receive a single argument enabling access to the extensions API.

Extension may export other functions to enable other extensions to call them. In order for one extension to be allowed to call functions of other extensions it must declare dependent extensions in its `package.json` as it's done in a `helloWorld` extension.

# How are extensions built and executed

* `setup-extensions` npm script reads `package.json` of every extension, installs its dependencies and runs a `compile` script for every extension.
* It then generates a file which imports all extensions.
* The generated file is imported, extensions iterated and `activate` method is executed for every extension.
