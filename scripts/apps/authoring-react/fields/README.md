# Fields and Field Adapters

This document explains the architecture of **fields** and **field-adapters** in the authoring-react module.

## Overview

The authoring system uses two complementary concepts:

- **Fields**: Generic, reusable UI components for editing specific data types (e.g., dropdown, date, editor3 rich text)
- **Field Adapters**: Mappings that connect article fields (e.g., `headline`, `slugline`) to field types and handle data transformation

## Fields (`/fields`)

Fields are **generic, reusable field type implementations** that define how to edit and display a particular kind of data. They are registered as `customFieldTypes` via the extension system.

### Structure

Each field type typically contains:

| File | Purpose |
|------|---------|
| `index.ts` | Exports the field definition implementing `ICustomFieldType` |
| `editor.tsx` | The editing component shown in the authoring view |
| `preview.tsx` | The read-only preview component |
| `config.tsx` | Configuration UI for content profile setup (optional) |
| `difference.tsx` | Component for showing changes between versions (optional) |

### Field Definition (`ICustomFieldType`)

```typescript
const field: ICustomFieldType<TValueOperational, TValueStorage, TConfig, TUserPreferences> = {
    id: 'dropdown',                    // Unique identifier
    label: gettext('Dropdown'),        // Display name in UI
    editorComponent: Editor,           // React component for editing
    previewComponent: Preview,         // React component for preview
    configComponent: Config,           // React component for field configuration
    differenceComponent: Difference,   // React component for diff view
    hasValue: (value) => value != null,// Function to check if field has a value
    getEmptyValue: (config) => null,   // Function to get initial empty value
};
```

### Available Field Types

- `editor3` - Rich text editor (Draft.js based)
- `dropdown` - Single/multi-select dropdown (supports manual entries, vocabularies, remote sources)
- `date` / `datetime` / `time` - Date and time pickers
- `duration` - Duration input
- `media` - Media attachments (images, video, audio)
- `linked-items` - Related article links
- `attachments` - File attachments
- `embed` - Embedded content (iframes, social media)
- `urls` - URL list input
- `tag-input` - Tag/keyword input
- `dateline` - Dateline with location and date
- `boolean` - Checkbox/toggle
- `package-items` - Package article items

## Field Adapters (`/field-adapters`)

Field adapters are the **bridge between article fields and field types**. They handle:

1. **Mapping** an article field to a field type
2. **Retrieving** stored values from the article
3. **Storing** edited values back to the article

### Why Adapters?

Articles have many predefined properties (`headline`, `slugline`, `body_html`, etc.) that are stored in specific formats. Field adapters:

- Map these properties to appropriate field types (e.g., `headline` → `editor3`)
- Configure the field type appropriately (e.g., single-line, character limits)
- Transform data between the field's operational format and the article's storage format

### Adapter Interface (`IFieldAdapter`)

```typescript
const slugline: IFieldAdapter<IArticle> = {
    // Converts field editor/schema config to IAuthoringFieldV2
    getFieldV2: (fieldEditor, fieldSchema) => {
        const fieldConfig: IEditor3Config = {
            editorFormat: [],
            minLength: fieldSchema?.minlength,
            maxLength: fieldSchema?.maxlength,
            singleLine: true,
            // ...
        };

        return {
            id: 'slugline',
            name: gettext('Slugline'),
            fieldType: 'editor3',      // References a registered field type
            fieldConfig,
        };
    },

    // Extracts the value from an article for editing
    retrieveStoredValue: (item: IArticle, authoringStorage) => {
        return retrieveStoredValueEditor3Generic('slugline', item, authoringStorage);
    },

    // Saves the edited value back to the article
    storeValue: (value, item, config) => {
        const result = storeEditor3ValueBase('slugline', item, value, config);
        return {
            ...result.article,
            slugline: result.stringValue,  // Store in article.slugline
        };
    },
};
```

### Base Adapters

The `getBaseFieldsAdapter()` function returns adapters for all standard article fields:

- `headline`, `slugline`, `abstract`, `byline` → `editor3` (single-line)
- `body_html`, `body_footer` → `editor3` (multi-line)
- `urgency`, `priority` → `dropdown`
- `genre`, `place`, `subject`, `anpa_category` → `dropdown` (vocabulary-based)
- `feature_media` → `media`
- `attachments` → `attachments`
- `dateline` → `dateline`
- And more...

### Dynamic Adapters

For custom fields defined in vocabularies (`vocabulary.field_type`), adapters are generated dynamically in `getFieldsAdapter()`:

```typescript
for (const vocabulary of customFieldVocabularies) {
    if (vocabulary.field_type === 'text') {
        adapter[vocabulary._id] = {
            getFieldV2: (...) => ({ fieldType: 'editor3', ... }),
            retrieveStoredValue: ...,
            storeValue: ...,
        };
    } else if (vocabulary.field_type === 'date') {
        adapter[vocabulary._id] = {
            getFieldV2: (...) => ({ fieldType: 'date', ... }),
        };
    }
    // ... more field types
}
```

## How They Work Together

```
┌─────────────────────────────────────────────────────────────────┐
│                        Content Profile                           │
│  Defines which fields appear and their validation rules          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Field Adapter                              │
│  - Maps article field → field type                            │
│  - Configures the field (limits, formats, etc.)                  │
│  - Handles retrieve/store value transformations                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Field                                   │
│  - Generic UI component (editor, preview, config)                │
│  - Knows nothing about specific article fields               │
│  - Works with operational values and config                      │
└─────────────────────────────────────────────────────────────────┘
```

### Example Flow: Editing `headline`

1. **Load article**: System looks up adapter for `headline`
2. **Retrieve value**: Adapter's `retrieveStoredValue` extracts Draft.js content from `article.fields_meta.headline` or creates it from `article.headline` string
3. **Render editor**: Adapter's `getFieldV2` returns config saying to use `editor3` field type with single-line mode
4. **User edits**: The `editor3` field component handles all editing UI
5. **Save**: Adapter's `storeValue` converts Draft.js state back to string and updates both `article.headline` and `article.fields_meta.headline`

## Adding a New Field Type

1. Create a new folder under `/fields` with the field type name
2. Implement `ICustomFieldType` with editor, preview, and optionally config/difference components
3. Register in `register-fields.ts` via `customFieldTypes` array

## Adding an Adapter for an Article Field

1. Create a new file in `/field-adapters`
2. Implement `IFieldAdapter<IArticle>` with `getFieldV2`, `retrieveStoredValue`, and `storeValue`
3. Add to the adapter object in `getBaseFieldsAdapter()`
