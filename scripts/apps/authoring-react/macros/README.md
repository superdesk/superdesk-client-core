# Macro types:

### Interactive

When `action_type === 'interactive'`

- won't have `replace_type`

### Non-interactive

When `action_type === 'non-interactive ???'`

#### Replace types:
- `no-replace` - doesn't do anything on the front-end
- `keep-style-replace` - replaces a part of the editor3 field - maintains inline styles
- `simple-replace` reloading the entire article
- `editor-state` - re-initializes editor state from fields_meta
