import _ from 'lodash';

RoleUnique.$inject = ['api', '$q'];
export function RoleUnique(api, $q) {
    return {
        require: 'ngModel',
        link: function(scope, element, attrs, ctrl) {
            /**
             * Test if given value is unique for seleted field
             */
            function testUnique(modelValue, viewValue) {
                var value = modelValue || viewValue;

                if (value) {
                    var criteria: any = {where: {name: value}};

                    if (!_.isNil(scope.editRole) && !_.isNil(scope.editRole._id)) {
                        criteria.where._id = {$ne: scope.editRole._id};
                    }
                    return api.roles.query(criteria)
                        .then((roles) => {
                            if (roles._items.length) {
                                return $q.reject(roles);
                            }
                            return roles;
                        });
                }

                // mark as ok
                return $q.when();
            }

            ctrl.$asyncValidators.unique = testUnique;
        },
    };
}
