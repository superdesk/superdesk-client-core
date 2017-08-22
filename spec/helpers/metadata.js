const utils = require('./utils');

class MetadataHelper {
    open() {
        utils.nav('settings/vocabularies');
    }

    openCustomTextFields() {
        element(by.buttonText('Custom text fields')).click();
    }

    addNew(id, label) {
        element(by.partialButtonText('Add New')).click();
        element(by.model('vocabulary._id')).sendKeys(id);
        element(by.model('vocabulary.display_name')).sendKeys(label);
        element(by.buttonText('Save')).click();
    }

    items() {
        return element.all(by.repeater('vocabulary in vocabularies'));
    }
}

module.exports = new MetadataHelper();
