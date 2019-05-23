/**
 * This module extends (and overrides) MediumEditor's anchor button to disallow
 * malformed URLs when the 'linkValidation: true' option is set.
 *
 * It additionally introduces the possibility to set the validation pattern
 * using the 'pattern' option when configuring the editor.
 */
import MediumEditor from 'medium-editor';

class CustomAnchorButton extends MediumEditor.extensions.anchor {
    linkValidation: any;
    pattern: any;
    getForm: any;

    createForm() {
        let form = super.createForm();

        if (!this.linkValidation) {
            return form;
        }

        let input = form.getElementsByTagName('input')[0];

        input.setAttribute('type', 'url');
        input.setAttribute('required', '');
        if (this.pattern) {
            input.setAttribute('pattern', this.pattern);
        }

        return form;
    }

    doFormSave() {
        let input = this.getForm().getElementsByTagName('input')[0];

        // prevent double encoding; medium editor don't detect if the url is already encoded
        input.value = decodeURIComponent(input.value);

        let isValid = input.checkValidity();

        if (isValid) {
            super.doFormSave();
        }
    }
}

// override default anchor
MediumEditor.extensions.anchor = CustomAnchorButton;
