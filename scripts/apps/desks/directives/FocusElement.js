import {defer} from 'lodash';

export function FocusElement() {
    return {
        link: function(scope, elem, attrs) {
            elem.click(() => {
                defer(() => {
                    angular.element(document.querySelector(attrs.target)).focus();
                });
            });
        },
    };
}
