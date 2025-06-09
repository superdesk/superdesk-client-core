# List of available spellcheckers

### Dictionary-based

Fetches language dictionaries once and performs spellchecking synchronously.

### API based

API is called to fetch and display spellchecker suggestions. 3rd party spellchecking services can be integrated using this method.

### Tansa spellchecker integration

Tansa spellchecker can't be integrated on top of our API-based spellchecker because it requires a custom user interface to handle spellchecker suggestions. It can only be invoked to check the entire text and doesn't support highlighting issues while typing.

# How is it decided which spellchecker will get used?

If tansa spellchecker integration is enabled - no other spellchecker will be used.

Otherwise it depends on article's language. If there is an API based spellchecker configured for that language(`appConfig.spellcheckers`) - it will be used. If API based spellchecker is not available, dictionary based spellchecking will be used - given there's a dictionary for that language.