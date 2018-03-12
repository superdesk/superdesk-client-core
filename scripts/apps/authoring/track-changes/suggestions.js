import {
    editor3DataKeys,
    getCustomDataFromEditor
} from 'core/editor3/helpers/editor3CustomData';

function getAllUserIdsFromSuggestions(suggestions) {
    const users = [];

    suggestions.forEach(({resolutionInfo, suggestionInfo}) => {
        users.push(resolutionInfo.resolverUserId);
        users.push(suggestionInfo.author);
    });

    return users.filter((value, index, self) => self.indexOf(value) === index);
}

function filterUsers(users, ids) {
    return users.filter((user) => ids.includes(user._id));
}

function convertUsersArrayToObject(users) {
    const usersObj = {};

    users.forEach((user) => {
        usersObj[user._id] = user;
    });

    return usersObj;
}

function getTypeText(type) {
    switch (type) {
    case 'ADD_SUGGESTION':
        return gettext('Added');
    case 'DELETE_SUGGESTION':
        return gettext('Deleted');
    default:
        return '';
    }
}

SuggestionsCtrl.$inject = ['$scope', 'userList'];
function SuggestionsCtrl($scope, userList) {
    const editorState = $scope.item.editor_state;

    const suggestions =
        getCustomDataFromEditor(
            editorState,
            editor3DataKeys.RESOLVED_SUGGESTIONS_HISTORY
        ) || [];

    if (suggestions.length === 0) {
        $scope.items = [];
        return;
    }

    const userIds = getAllUserIdsFromSuggestions(suggestions);

    userList.getAll()
        .then((users) => {
            $scope.users = convertUsersArrayToObject(filterUsers(users, userIds));
            $scope.items = suggestions;
        });

    $scope.getTypeText = getTypeText;
}

angular
    .module('superdesk.apps.authoring.track-changes.suggestions', [
        'superdesk.apps.authoring.widgets'
    ])
    .config([
        'authoringWidgetsProvider',
        function(authoringWidgetsProvider) {
            authoringWidgetsProvider.widget('suggestions', {
                icon: 'suggestion',
                label: gettext('Suggestions'),
                template:
                'scripts/apps/authoring/track-changes/views/suggestions-widget.html',
                order: 10,
                side: 'right',
                display: {
                    authoring: true,
                    packages: true,
                    killedItem: true,
                    legalArchive: false,
                    archived: false,
                    picture: true,
                    personal: true
                }
            });
        }
    ])

    .controller('SuggestionsCtrl', SuggestionsCtrl);
