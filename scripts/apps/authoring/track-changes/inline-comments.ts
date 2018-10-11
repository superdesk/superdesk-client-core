import {
    META_FIELD_NAME,
    fieldsMetaKeys,
    getFieldId,
    getFieldMetadata,
} from 'core/editor3/helpers/fieldsMeta';
import {
    editor3DataKeys,
    getCustomDataFromEditorRawState,
} from 'core/editor3/helpers/editor3CustomData';
import {
    getRangeAndTextForStyleInRawState,
} from 'core/editor3/helpers/highlights';
import {highlightsConfig} from 'core/editor3/highlightsConfig';
import {getCustomMetadata} from 'core/editor3/helpers/editor3CustomData';
import {getLabelNameResolver} from 'apps/workspace/helpers/getLabelForFieldId';

function getAllUserIdsFromComments(comments) {
    const users = [];

    comments.forEach(({data}) => {
        users.push(data.authorId);
        if (data.resolutionInfo) {
            users.push(data.resolutionInfo.resolverUserId);
        }
        data.replies.map((reply) => users.push(reply.authorId));
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

function getCommentsFromField(getLabelForFieldId) {
    return (obj) => ({
        fieldName: getLabelForFieldId(getFieldId(obj.contentKey)),
        comments: getCustomDataFromEditorRawState(
            obj[fieldsMetaKeys.draftjsState],
            editor3DataKeys.RESOLVED_COMMENTS_HISTORY,
        ) || [],
    });
}

InlineCommentsCtrl.$inject = ['$scope', 'userList', 'metadata', 'content'];
function InlineCommentsCtrl($scope, userList, metadata, content) {
    getLabelNameResolver().then((getLabelForFieldId) => {
        $scope.resolvedFilter = 'RESOLVED';

        const editors = Object.keys($scope.item[META_FIELD_NAME])
            .map((contentKey) => ({
                contentKey: contentKey,
                [fieldsMetaKeys.draftjsState]: getFieldMetadata(
                    $scope.item,
                    contentKey,
                    fieldsMetaKeys.draftjsState,
                ),
            }))
            .filter((obj) => obj[fieldsMetaKeys.draftjsState] != null);

        const resolvedComments = editors
            .map(getCommentsFromField(getLabelForFieldId))
            .filter((obj) => obj.comments.length > 0);

        const unresolvedComments = Object.keys($scope.item[META_FIELD_NAME]).map((contentKey) => {
            const rawEditorState = getFieldMetadata(
                $scope.item,
                contentKey,
                fieldsMetaKeys.draftjsState,
            );

            const comments = getCustomMetadata($scope.item, contentKey, highlightsConfig.COMMENT.type)
                .map((highlight) => {
                    const highlightId = highlight.styleName;
                    const highlightWithCommentTextAdded = {
                        ...highlight.obj,
                        data: {
                            ...highlight.obj.data,
                            commentedText: getRangeAndTextForStyleInRawState(
                                rawEditorState,
                                highlightId,
                            ).highlightedText,
                        },
                    };

                    return {...highlightWithCommentTextAdded, highlightId: highlightId};
                });

            return {
                fieldId: contentKey,
                fieldName: getLabelForFieldId(getFieldId(contentKey)),
                comments: comments,
            };
        })
            .filter((obj) => obj.comments.length > 0);

        const allComments = []
            .concat(...resolvedComments.map((obj) => obj.comments))
            .concat(...unresolvedComments.map((obj) => obj.comments));

        const userIds = getAllUserIdsFromComments(allComments);

        const comments = {
            RESOLVED: resolvedComments,
            UNRESOLVED: unresolvedComments,
        };

        userList.getAll().then((users) => {
            $scope.users = convertUsersArrayToObject(filterUsers(users, userIds));
            $scope.items = comments;
        });
    });
}

angular
    .module('superdesk.apps.authoring.track-changes.inline-comments', [
        'superdesk.apps.authoring.widgets',
    ])
    .config([
        'authoringWidgetsProvider',
        function(authoringWidgetsProvider) {
            authoringWidgetsProvider.widget('inline-comments', {
                icon: 'comments',
                label: gettext('Inline comments'),
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
                    personal: true,
                },
                onlyEditor3: true,
                feature: 'editorInlineComments',
            });
        },
    ])

    .controller('InlineCommentsCtrl', InlineCommentsCtrl);
