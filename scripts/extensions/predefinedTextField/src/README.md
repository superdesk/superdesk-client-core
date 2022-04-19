# Feature description

The field enables to choose from predefined text values that are managed in field configuration options. There's a configuration option in the UI that enables switching from predefined values to plain text.

The value is stored as HTML string and is matched against predefined values to display in the UI whether a predefined option or free text is selected at any given moment.

# Placeholders

Limited placeholder support is implemented, a significant constraint being that only static data that does not change when an article is being edited can be used as a placeholder. To set up placeholders, pass the following configuration object when registering the extension:

```JavaScript
startApp(
        [
            {
                id: 'predefinedTextField',
                load: () => import('superdesk-core/scripts/extensions/predefinedTextField'),
                configuration: {
                    placeholderMapping: {
                        'custom-id': 'extra.custom-id',
                    },
                },
            },
        ],
        {},
        {},
    );

```

Mapping is used to avoid exposing `IArticle` data structure in the application UI.
