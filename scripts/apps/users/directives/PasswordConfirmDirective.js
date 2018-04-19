export function PasswordConfirmDirective() {
    var NAME = 'confirm';

    return {
        require: 'ngModel',
        scope: {password: '='},
        link: function(scope, element, attrs, ctrl) {
            function isMatch(password, confirm) {
                return !password || password === confirm;
            }

            ctrl.$validators[NAME] = function(modelValue, viewValue) {
                var value = modelValue || viewValue;

                return isMatch(scope.password, value);
            };

            scope.$watch('password', (password) => {
                ctrl.$setValidity(NAME, isMatch(password, ctrl.$viewValue));
            });
        },
    };
}
