/**
 * This module extends (and overrides) MediumEditor's anchor button to disallow
 * malformed URLs when the 'linkValidation: true' option is set.
 *
 * It additionally introduces the possibility to set the validation pattern
 * using the 'pattern' option when configuring the editor. By default it will
 * use the expression specified in RFC3986: Uniform Resource Identifier (URI):
 * Generic Syntax from http://www.ietf.org/rfc/rfc3986.txt.
 */
import MediumEditor from 'medium-editor';

const uriPattern = '^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?';

class CustomAnchorButton extends MediumEditor.extensions.anchor {
    createForm() {
        let form = super.createForm();

        if (!this.linkValidation) {
            return form;
        }

        let input = form.getElementsByTagName('input')[0];
        input.setAttribute('type', 'url');
        input.setAttribute('required', '');
        input.setAttribute('pattern', this.pattern || uriPattern);

        return form;
    }

    doFormSave() {
        let input = this.getForm().getElementsByTagName('input')[0];
        let isValid = input.checkValidity();
        if (isValid) {
            super.doFormSave();
        }
    }
}

// override default anchor
MediumEditor.extensions.anchor = CustomAnchorButton;
