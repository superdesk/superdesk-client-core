/**
 * @ngdoc directive
 * @module superdesk.apps.web_publisher
 * @name sdCardInputFocus
 * @description Directive to handle focus in card on edit
 */
export function CardInputFocusDirective() {
    class CardInputFocus {
        link(scope, element) {
            element[0].focus();
        }
    }

    return new CardInputFocus();
}
