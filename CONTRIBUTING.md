## Contribution guidelines

### Pull requests

* When opening a pull request, add a JIRA issue ID to the description.

## Testing

<details>
  <summary>Only `data-test-id` markers should be used to query for DOM elements</summary>
  If tests are tightly coupled with implementation details, false-positive test failures occur and slow down development. The slowdown also increases as the codebase grows. Tests should not fail if for example `a` tag is changed to a `button`, but still works the same. Or if a class name is changed from `button--large` to `button--small`, or if the element is wrapped in another element for styling or an angular directive is replaced with a react component. If things look and behave the same from the user perspective - the tests should not fail either. Using `data-test-id` reduces false-positive test failures significantly by decoupling tests from implementation details. See `spec/internal_destinations_spec.ts` for an example of how to write tests using `data-test-id` markers.
</details>