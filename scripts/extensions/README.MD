# Purpose

The main purpose of extensions is to reduce the complexity and interdependencies in the code. Extensions only communicate via APIs, so they do not add any complexity to the core except that required to implement the APIs.

# How to create an extension

It's easiest to copy the `helloWorld` extension and change the directory name.

# Writing end-to-end tests for extensions

Not supported at the moment.

# How extensions work

Extensions must be implemented as standalone ES6 modules. Every extension must export `activate` function which will receive a single argument enabling access to the extensions API.

Extension may export other functions to enable other extensions to call them. In order for one extension to be allowed to call functions of other extensions it must declare dependent extensions in its `package.json` as it's done in a `helloWorld` extension.

# How are extensions built and executed

* Extensions are built using a CLI tool by running the following command in the root repository `@superdesk/build-tools extensions build {root-client-dir}`. It installs dependencies, compiles, namespaces CSS and includes translations from each extension. When client-core starts, it executes `activate` method of each extension.


# Styling

Extension specific styles can be added by creating a file in `extension-folder/src/index.css`. The classnames and ids are prefixed on build so extension styles don't conflict with main application styles. Due to prefixing, a `superdesk.utilities.CSS.getClass` has to be used to get the correct classname at runtime.

There's an npm task - "watch-css-from-extensions" for rebuilding extension styles on file change.

# Translations

In order for translations to be accessible via `gettext` function that is exposed via the extensions API, it is required to put `.po` files in a directory, and add an the following entry to `package.json` of an extension(path relative to `package.json`):

```
superdeskExtension: {
    "translations-directory": "./dir-name"
}
```