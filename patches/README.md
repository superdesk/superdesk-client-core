# immutable+3.8.2.patch

Fixes types in immutable so values in predicate callback are not received as optional. It's likely this is already fixed in newer versions of immutable.

# @types+draft-js++immutable+3.7.6.patch

Same immutable patch, but applies also to immutable types located inside draft-js

# csstype+2.6.17

Removing some CSS properties from types like `paddingLeft`, `borderLeft` etc. to enforce RTL support.

# shallow-equal (dependency of memoize-one)

It has multiple entry points in package.json. One of them is "module" which webpack chooses and fails to compile due to newer syntax used. ES6 imports I suspect are the issue. I tried to patch package.json itself so "module" points to the same file as "main", but patch-package appears not to generate patches on package.json itself. In the end I copied entire contents of `dist/index.js` into `dist/index.modern.mjs`. We may attempt to drop this patch after upgrading to webpack 4.