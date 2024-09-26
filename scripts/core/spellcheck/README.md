# List of available spellcheckers

### Dictionary-based

Fetches language dictionaries once and performs spellchecking synchronously.

### API based

API is called to fetch and display spellchecker suggestions. 3rd party spellchecking services can be integrated using this method.

### Tansa spellchecker integration

Tansa spellchecker can't be integrated on top of our API-based spellchecker because it requires a custom user interface to handle spellchecker suggestions. It can only be invoked to check the entire text and doesn't support highlighting issues while typing.