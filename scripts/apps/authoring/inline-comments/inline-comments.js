import {
    editor3DataKeys,
    getCustomDataFromEditor
} from 'core/editor3/helpers/editor3CustomData';

function getAllUserIdsFromComments(comments) {
    const users = {};

    comments.forEach(({data}) => {
        users[data.authorId] = null;
        users[data.resolutionInfo.resolverUserId] = null;
        data.replies.map((reply) => users[reply.authorId] = null);
    });

    return Object.keys(users);
}

function injectUsersInComments(users, comments) {
    return comments.map((comment) => {
        comment.data.user = users[comment.data.authorId];
        comment.data.resolutionInfo.user = users[comment.data.resolutionInfo.resolverUserId];
        comment.data.replies = comment.data.replies.map((reply) => {
            reply.user = users[reply.authorId];
            return reply;
        });
        return comment;
    });
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

InlineCommentsCtrl.$inject = ['$scope', 'api'];
function InlineCommentsCtrl($scope, api) {
    const editorState = $scope.item.editor_state;

    const comments =
        getCustomDataFromEditor(
            editorState,
            editor3DataKeys.RESOLVED_COMMENTS_HISTORY
        ) || [];

    const usersIds = getUsersAsQueryArray(comments);

    api.query('users', {where: JSON.stringify({$or: usersIds})})
        .then(({_items}) => {
            const users = convertUsersArrayToObject(_items);

            $scope.items = injectUsersInComments(users, comments);
        });
}

angular
    .module('superdesk.apps.authoring.inline-comments', [
        'superdesk.apps.authoring.widgets'
    ])
    .config([
        'authoringWidgetsProvider',
        function(authoringWidgetsProvider) {
            authoringWidgetsProvider.widget('inline-comments', {
                icon: 'comments',
                label: gettext('Resolved Comments'),
                template:
                'scripts/apps/authoring/inline-comments/views/inline-comments-widget.html',
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
