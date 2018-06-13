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
import {getLabelForFieldId} from 'apps/workspace/helpers/getLabelForFieldId';
import {
    getRangeAndTextForStyleInRawState,
} from 'core/editor3/helpers/highlights';
import {highlightsConfig} from 'core/editor3/highlightsConfig';

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

function getCommentsFromField(customFields, resolved = true) {
    if (resolved) {
        return (obj) => ({
            fieldName: getLabelForFieldId(getFieldId(obj.contentKey), customFields),
            comments: getCustomDataFromEditorRawState(
                obj[fieldsMetaKeys.draftjsState],
                editor3DataKeys.RESOLVED_COMMENTS_HISTORY
            ) || [],
        });
    } else {
        return (obj) => {
            const highlightsObject = getCustomDataFromEditorRawState(
                obj[fieldsMetaKeys.draftjsState],
                editor3DataKeys.MULTIPLE_HIGHLIGHTS
            ).highlightsData || {};

            for (const id in highlightsObject) {
                // Add id to highlight so we can retrieve data from the state
                highlightsObject[id].highlightId = id;
            }

            const fieldId = getFieldId(obj.contentKey);
            const fieldLabel = getLabelForFieldId(fieldId, customFields);

            return {
                fieldName: fieldLabel,
                fieldId: fieldId,
                comments: Object.values(highlightsObject).filter(
                    (h) => h.type === highlightsConfig.COMMENT.type
                ),
            };
        };
    }
}

InlineCommentsCtrl.$inject = ['$scope', 'userList', 'metadata', 'content'];
function InlineCommentsCtrl($scope, userList, metadata, content) {
    content.getCustomFields().then((customFields) => {
        $scope.resolvedFilter = 'RESOLVED';

        const editors = Object.keys($scope.item[META_FIELD_NAME])
            .map((contentKey) => ({
                contentKey: contentKey,
                [fieldsMetaKeys.draftjsState]: getFieldMetadata(
                    $scope.item,
                    contentKey,
                    fieldsMetaKeys.draftjsState
                ),
            }))
            .filter((obj) => obj[fieldsMetaKeys.draftjsState] != null);

        const resolvedComments = editors
            .map(getCommentsFromField(customFields))
            .filter((obj) => obj.comments.length > 0);

        let unresolvedComments = editors
            .map(getCommentsFromField(customFields, false))
            .filter((obj) => obj.comments.length > 0);

        if (unresolvedComments.length === 0 && resolvedComments.length === 0) {
            $scope.items = {
                RESOLVED: [],
                UNRESOLVED: [],
            };
            return;
        }

        unresolvedComments = unresolvedComments.map(({fieldId, comments, ...rest}) => {
            const editor = editors.find((e) => e.contentKey === fieldId);
            const rawEditorState = editor[fieldsMetaKeys.draftjsState];

            const stylesInEditorObject = {};

            for (const {inlineStyleRanges} of rawEditorState.blocks) {
                for (const {style} of inlineStyleRanges) {
                    stylesInEditorObject[style] = true;
                }
            }

            const stylesInEditor = Object.keys(stylesInEditorObject);

            const currentCommentsInEditor = [];

            for (const style of stylesInEditor) {
                const comment = comments.find((c) => c.highlightId === style);

                if (comment) {
                    const {highlightedText} = getRangeAndTextForStyleInRawState(rawEditorState, comment.highlightId);

                    currentCommentsInEditor.push({
                        ...comment,
                        data: {
                            ...comment.data,
                            commentedText: highlightedText,
                        },
                    });
                }
            }

            return {
                ...rest,
                fieldId: fieldId,
                comments: currentCommentsInEditor,
            };
        });

        // After orphan comments have been filtered out, array could be empty
        unresolvedComments = unresolvedComments.filter((o) => o.comments.length > 0);

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
            });
        },
    ])

    .controller('InlineCommentsCtrl', InlineCommentsCtrl);
