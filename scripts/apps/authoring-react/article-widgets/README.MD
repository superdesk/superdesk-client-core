# About

These widgets are react-only widgets that will appear in both - current and new versions of authoring when enabled.
The goal is to re-implement existing angular widgets in react. We can run react code inside angularjs, but not vice-versa.
When a widget is re-implemented in react, we can delete the angular code
and enable the widget in `../manage-widget-registration.ts`.

# Adding a widget

* Add a file or folder per widget.
* Export an object or a function returning the object implementing `IAuthoringSideWidget` interface.
* Import it in `../manage-widget-registration.ts`
* Use `AuthoringWidgetLayout` as a root widget component.

To update the article that is being edited, call `sdApi.article.patch`.

An example is available in ./demo-widget.tsx
