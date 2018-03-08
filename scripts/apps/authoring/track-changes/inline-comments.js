import {
    editor3DataKeys,
    getCustomDataFromEditor
} from 'core/editor3/helpers/editor3CustomData';

function getAllUserIdsFromComments(comments) {
    const users = [];

    comments.forEach(({data}) => {
        users.push(data.authorId);
        users.push(data.resolutionInfo.resolverUserId);
        data.replies.map((reply) => users.push(reply.authorId));
    });

    return users.filter((value, index, self) => self.indexOf(value) === index);
}

function getUsersAsQueryArray(comments) {
    return getAllUserIdsFromComments(comments)
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

InlineCommentsCtrl.$inject = ['$scope', 'api'];
function InlineCommentsCtrl($scope, api) {
    const editorState = $scope.item.editor_state;

    const comments =
        getCustomDataFromEditor(
            editorState,
            editor3DataKeys.RESOLVED_COMMENTS_HISTORY
        ) || [];

    if (comments.length === 0) {
        $scope.items = [];
        return;
    }

    const usersIds = getUsersAsQueryArray(comments);

    getUsersFromAPI(api, {$or: usersIds})
        .then(({_items}) => {
            $scope.users = convertUsersArrayToObject(_items);
            $scope.items = comments;
        });
}

angular
    .module('superdesk.apps.authoring.track-changes.inline-comments', [
        'superdesk.apps.authoring.widgets'
    ])
    .config([
        'authoringWidgetsProvider',
        function(authoringWidgetsProvider) {
            authoringWidgetsProvider.widget('inline-comments', {
                icon: 'comments',
                label: gettext('Resolved Comments'),
                template:
                'scripts/apps/authoring/track-changes/views/inline-comments-widget.html',
                order: 9,
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

    .controller('InlineCommentsCtrl', InlineCommentsCtrl);
