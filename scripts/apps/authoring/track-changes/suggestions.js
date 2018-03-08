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

function getUsersAsQueryArray(suggestions) {
    return getAllUserIdsFromSuggestions(suggestions)
        .map((key) => ({_id: key}));
}

function convertUsersArrayToObject(users) {
    const usersObj = {};

    users.forEach((user) => {
        usersObj[user._id] = user;
    });

    return usersObj;
}

function getUsersFromAPI(api, query) {
    return api.query('users', {where: JSON.stringify(query)});
}

function getTypeText(type) {
    switch (type) {
    case 'ADD_SUGGESTION':
        return 'Added';
    case 'DELETE_SUGGESTION':
        return 'Deleted';
    default:
        return '';
    }
}

SuggestionsCtrl.$inject = ['$scope', 'api'];
function SuggestionsCtrl($scope, api) {
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

    const usersIds = getUsersAsQueryArray(suggestions);

    getUsersFromAPI(api, {$or: usersIds})
        .then(({_items}) => {
            $scope.users = convertUsersArrayToObject(_items);
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
                icon: 'multiedit',
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
