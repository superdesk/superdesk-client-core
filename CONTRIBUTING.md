## Contribution guidelines

Before opening a pull request on the Superdesk project, please read through this document and make sure that your changes follow our contribution guidelines.

We accept all contributions to Superdesk. Changes containing fixes or enhancements can be opened freely, but before comitting to adding new features, please open a discussion about your intentions on our [Issues](https://github.com/superdesk/superdesk-client-core/issues) page, so we can discuss these before starting any work.

### Checklist

* All code must be documented and checked using `grunt docs`.
* Changes that contain functional code must be unit tested.
* Presentational code that affects UI must come with behavioral (e2e) tests.
* Keep commit history clean (see recommendations further down this page).

Last but not least, review your own code before submitting it for others to review, using GitHub's [compare tool](https://github.com/superdesk/superdesk-client-core/compare) or any other preferred method.

### Documentation

* All code must contain documentation, especially public facing definitions (modules, components, services, methods, scope properties, functions, variables, attributes, etc).


* Private identifiers that are not self-explanatory or easy to understand must also be documented.


* Complex code must be augmented with inline comments to make it easily understandable to third parties and other contributors.

In the Superdesk client application, we use a pre-configured package of the [dgeni](https://github.com/angular/dgeni) framework called [dgeni-alive](https://github.com/wingedfox/dgeni-alive). 

Some examples on how to write documentation that is compatible with this framework can be found by looking at already existing modules as an example, such as the [TranslationService](https://github.com/superdesk/superdesk-client-core/blob/master/scripts/apps/translations/services/TranslationService.js), the [suggest](https://github.com/superdesk/superdesk-client-core/blob/master/scripts/apps/authoring/suggest) module or the examples provided in the [README.md](https://github.com/wingedfox/dgeni-alive/blob/master/README.md#demo-projects) file of the dgeni-alive project.

Before submitting your pull request, make sure you've checked if your documentation is displayed correctly by running the `grunt docs` task, which will open a static webpage displaying the documentation that is currently available in the repository.

### Commits

To be able to track changes easily and keep our commit history human-readable, we need to follow some simple guidelines:

* Include the identifier of the issue you are solving (JIRA or GitHub) into your commit message, for example: "Adds 'Save' button to profile window (SDESK-123)".

* When your branch falls behind master, always use `git rebase master` instead of merge, to avoid commit message which reflect that you've done this operation.

* Resort to only one commit per change. If your pull request is easier to review using multiple commits, do so, but squash before merging.


### Guidelines

#### Use "block body" style arrow functions if its return value is not used

> When "block body" style arrow functions are used, and there is no `return` inside the curly brackets, it is guaranteed that the return value of the function is not used, so it makes it easier to remove the function when refactoring without having to search for calling functions and check whether they use the return value or not.

Types of arrow functions:
* "block body":  ` (x, y) => { return x + y; };` (no implicit return)
* "concise body": `(x, y) =>  x + y` (uses implicit return)