UserUniqueDirective.$inject = ['$q', 'api'];
export function UserUniqueDirective($q, api) {
    return {
        require: 'ngModel',
        scope: {exclude: '='},
        link: function(scope, element, attrs, ctrl) {
            /**
             * Test if given value is unique for seleted field
             */
            function testUnique(modelValue, viewValue) {
                var value = modelValue || viewValue;

                if (value && attrs.uniqueField) {
                    var criteria = {where: {}};

                    criteria.where[attrs.uniqueField] = value;
                    return api.users.query(criteria)
                        .then((users) => {
                            if (users._items.length
                                && (!scope.exclude._id || users._items[0]._id !== scope.exclude._id)) {
                                return $q.reject(users);
                            }

                            return users;
                        });
                }

                // mark as ok
                return $q.when();
            }

            ctrl.$asyncValidators.unique = testUnique;
        },
    };
}
