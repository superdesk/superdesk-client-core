// config holds the default configuration for the password strength calculator.
var config = {
    MIN_LENGTH: 8,
    ONE_LOWER: /^(?=.*[a-z])/g,
    ONE_UPPER: /^(?=.*[A-Z])/g,
    ONE_NUMBER: /^(?=.*[0-9])/g,
    ONE_OTHER: /^(?=.*[^0-9^a-z^A-Z])/g,
    MIN_STRENGTH: 3,
};

/**
 * @ngdoc directive
 * @module superdesk.core.directives
 * @name sdPasswordStrength
 *
 * @requires gettext
 * @requires https://docs.angularjs.org/api/ng/service/$interpolate $interpolate
 *
 * @param {Object} ngModel - model that the input is bound to
 *
 * @description Appends a strength indicator to the input that it is
 * added to. Strength is computed in the following way:
 *
 *   - If the length of the password is less than 8, strength will be set
 *     to 'Short'.
 *
 *   - Strength is increased whenever one of the following is found:
 *        - a lower-case letter
 *        - an upper-case letter
 *        - a number
 *        - another character
 */
PasswordStrength.$inject = ['gettext', '$interpolate'];
function PasswordStrength(gettext, $interpolate) {
    // styles holds each of the strength labels by index along with the class
    // to be added to the indicator.
    var styles = [
        {txt: gettext('Short'), cls: 'red'},
        {txt: gettext('Weak'), cls: 'red'},
        {txt: gettext('Better'), cls: 'yellow'},
        {txt: gettext('OK'), cls: 'green'},
        {txt: gettext('Strong'), cls: 'green'},
    ];

    // helpText holds the text that will be shown when the user hovers over the
    // informational icon.
    var helpText = gettext('Must be {{ MIN_LENGTH }} characters long and ' +
        'contain {{ MIN_STRENGTH }} out of 4 of the following:' +
        '<ul>' +
            '<li>a lower case letter (a-z)</li>' +
            '<li>an upper case letter (A-Z)</li>' +
            '<li>a number (0-9)</li>' +
            '<li>a special character (!@#$%^&...)</li>' +
        '</ul>');

    return {
        require: 'ngModel',
        scope: {
            password: '=ngModel',
        },
        link: function($scope, el, attr, ngModel) {
            var indicator = angular.element(
                '<div class="password-strength">' +
                    gettext('Strength') + ': <span class="label"></span>' +
                    '<div class="icon-question-sign"></div>' +
                '</div>'
            );

            indicator.find('.icon-question-sign').tooltip({
                title: $interpolate(helpText)(config),
                html: true,
            });

            ngModel.$error.weakPass = gettext('Password is too weak.');

            /*
             * @description updateStrength updates the indicator's state to
             * reflect the strength of the given password.
             * @param {string} pass the password to compute the strength of
             */
            var updateStrength = function updateStrength(pass) {
                var strength = 0;

                if (typeof pass !== 'undefined') {
                    strength = pass.length >= config.MIN_LENGTH ?
                        (config.ONE_LOWER.test(pass) ? 1 : 0) +
                    (config.ONE_UPPER.test(pass) ? 1 : 0) +
                    (config.ONE_NUMBER.test(pass) ? 1 : 0) +
                    (config.ONE_OTHER.test(pass) ? 1 : 0) : 0;
                }

                indicator.find('.label')
                    .text(styles[strength].txt)
                    .removeClass('red yellow green')
                    .addClass(styles[strength].cls);

                ngModel.$setValidity('weakPass', strength >= config.MIN_STRENGTH);
            };

            updateStrength(ngModel.$modelValue || '');
            $scope.$watch('password', updateStrength);
            indicator.insertAfter(el);
        },
    };
}

export default angular
    .module('superdesk.core.directives.passwordStrength', [])
    .directive('sdPasswordStrength', PasswordStrength);
