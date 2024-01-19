# Authoring react

## Field type

Field type is an object that implements `ICustomFieldType`. There can be many text fields in an article, like headline, abstract, custom-text-1 etc. but they would all use the same code that a field type provides.

## Important principles

There should be no special behavior depending on field ID. It should always be possible to create one more field of the same type and get the same behavior.

### Field data formats - **storage** and **operational**

Storage format refers to field data that is stored in `IArticle` when it's received from the API. Operational format is the one being used in runtime. In most cases it will be the same.

For example if we had a plain text input, we would use a string for storage, and also a string as operational format, since that's what `<input type="text" />` uses.

A different operational format is required, when working with an editor that uses a more complex format that requires custom code to serialize it for storage. For example, draft-js uses `EditorState` as an operational format and requires running additional code in order to serialize it to storage format - `RawDraftContentState`.

## Storage location of field data

The data of all fields is stored in `IArticle['extra']` by default. Custom storage location may be specified in field type(`ICustomFieldType`) or field adapter. If a function in field adapter is defined, the one in field type will be ignored.

## Field adapters

Field adapters are needed for two purposes.

1. To allow setting up built-in fields, that are not present in the database as custom fields.
2. To allow storing field data in other location that `IArticle['extra']`.

The code is simplified by using adapters, since there is only one place where storage details are defined, and the rest of the authoring code doesn't know about it.


## Article adapter

React based authoring isn't using "extra>" prefix for custom fields in `IArticle['fields_meta']`, because there can't be multiple fields with the same ID. I didn't know this when originally implementing `IArticle['fields_meta']`. An upgrade script may be written and prefix dropped completely when angular based authoring code is removed. In the meanwhile, the adapter makes it so the prefix isn't needed in authoring-react code, but is outputted when saving, to make the output compatible with angular based authoring. 
