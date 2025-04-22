import {sdApi} from 'api';
import {extensions} from 'appConfig';
import {notNullOrUndefined} from 'core/helpers/typescript-helpers';
import {gettext} from 'core/utils';
import {generate} from 'json-merge-patch';
import {omit} from 'lodash';
import {IExtensionActivationResult, IUser, IUserProfileSection} from 'superdesk-api';
import {readOnlyUserFields} from '../directives/UserEditDirective';

const getCoreSections: IExtensionActivationResult['contributions']['getUserProfileSections'] = (user) => {
    const sections: Array<IUserProfileSection> = [
        {
            id: 'overview',
            label: gettext('Overview'),
            priority: 1,
            component: null,
        },
    ];

    if (user._id === sdApi.user.getCurrentUserId()) {
        sections.push({
            id: 'preferences',
            label: gettext('Personal preferences'),
            priority: 2,
            component: null,
        });
    }

    if (sdApi.user.hasPrivilege('users')) {
        sections.push({
            id: 'privileges',
            label: gettext('Privileges'),
            priority: 3,
            component: null,
        });
    }

    return sections;
};

UserEditController.$inject = ['$scope', 'user', 'usersService'];
export function UserEditController($scope, user, usersService) {
    $scope.user = user;
    $scope.savingInProgress = false;

    const getSectionsFromExtension = Object.values(extensions)
        .map(({activationResult}) => activationResult?.contributions?.getUserProfileSections)
        .filter(notNullOrUndefined);

    $scope.sections = [
        getCoreSections,
        ...getSectionsFromExtension,
    ]
        .flatMap((getSectionsFn) => getSectionsFn($scope.user))
        .sort((a, b) => a.priority - b.priority);

    $scope.selectedSection = $scope.sections[0];

    $scope.setSelectedSection = (section) => {
        $scope.selectedSection = section;
    };

    $scope.onSave = (nextUser): Promise<IUser> => {
        $scope.savingInProgress = true;

        return usersService.save(user, omit(generate(user, nextUser), readOnlyUserFields))
            .then((saved) => {
                $scope.user = saved;

                return saved;
            })
            .finally(() => {
                $scope.savingInProgress = false;
            });
    };
}
