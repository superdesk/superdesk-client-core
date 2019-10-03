## Contribution guidelines

## Pull requests

* When opening a pull request, add a JIRA issue ID to the description.

## Technology

<details>
  <summary>Do not use Angularjs for new features</summary>
  Here are some issues with Angularjs which make it a much worse choice for future development compared to a TypeScript + React combination:
  * Lack of TypeScript support - templates can't be typed at all, which is a large part of the code.
  * Bad performance / hard to optimize, especially compared with React where most of the time implementing `shouldComponentUpdate` is enough.
  * Templating system is poor, there isn't even an `if-else` statement(only `if`). The existence of the templating system itself is a disadvantage compared to React where you can use the full power of JavaScript for data transformations, caching and all other things you'd do in a "non-template" code.
</details>

<details>
  <summary>Avoid writing Angularjs code when enhancing existing features</summary>
  Use `reactToAngular1` which enables using React components inside Angularjs templates.
</details>

## Architecture

<details>
  <summary>Build new features on top of extensions/features API</summary>
  The API allows building new features without having to depend on the messier parts of the old code which can't be refactored at once. On top of that, the core will get smaller and easier to maintain as more features are moved on top of the API. See https://github.com/superdesk/superdesk-core/issues/1585.
</details>

## Testing

<details>
  <summary>Only `data-test-id` markers should be used to query for DOM elements</summary>
  If tests are tightly coupled with implementation details, false-positive test failures occur and slow down development. The slowdown also increases as the codebase grows. Tests should not fail if for example `a` tag is changed to a `button`, but still works the same. Or if a class name is changed from `button--large` to `button--small`, or if the element is wrapped in another element for styling or an angular directive is replaced with a react component. If things look and behave the same from the user perspective - the tests should not fail either. Using `data-test-id` reduces false-positive test failures significantly by decoupling tests from implementation details. See `spec/internal_destinations_spec.ts` for an example of how to write tests using `data-test-id` markers.
</details>