import {
    editor3DataKeys,
    getCustomDataFromEditorRawState,
} from 'core/editor3/helpers/editor3CustomData';
import * as Highlights from 'core/editor3/helpers/highlights';

import {getLabelNameResolver} from 'apps/workspace/helpers/getLabelForFieldId';
import {fieldsMetaKeys, META_FIELD_NAME, getFieldMetadata, getFieldId} from '../../../core/editor3/helpers/fieldsMeta';

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

function getLocalizedTypeText(type, blockType) {
    const description = Highlights.getHighlightDescription(type);
    const blockStyleDescription = Highlights.getBlockStylesDescription(blockType);
    const space = blockStyleDescription != '' ? ' ' : '';

    return gettext(description) + space + gettext(blockStyleDescription);
}

SuggestionsCtrl.$inject = ['$scope', 'userList', 'content'];
function SuggestionsCtrl($scope, userList, content) {
    getLabelNameResolver().then((getLabelForFieldId) => {
        const suggestions = Object.keys($scope.item[META_FIELD_NAME])
            .map((contentKey) => ({
                contentKey: contentKey,
                [fieldsMetaKeys.draftjsState]: getFieldMetadata($scope.item, contentKey, fieldsMetaKeys.draftjsState),
            }))
            .filter((obj) => obj[fieldsMetaKeys.draftjsState] != null)
            .map((obj) => (
                {
                    fieldName: getLabelForFieldId(getFieldId(obj.contentKey)),
                    suggestions: getCustomDataFromEditorRawState(
                        obj[fieldsMetaKeys.draftjsState],
                        editor3DataKeys.RESOLVED_SUGGESTIONS_HISTORY
                    ) || [],
                }
            ))
            .filter((obj) => obj.suggestions.length > 0);

        if (suggestions.length === 0) {
            $scope.items = [];
            return;
        }

        const userIds = getAllUserIdsFromSuggestions([].concat(...suggestions.map((obj) => obj.suggestions)));

        userList.getAll()
            .then((users) => {
                $scope.users = convertUsersArrayToObject(filterUsers(users, userIds));
                $scope.items = suggestions;
            });

        $scope.getLocalizedTypeText = getLocalizedTypeText;
    });
}

angular
    .module('superdesk.apps.authoring.track-changes.suggestions', [
        'superdesk.apps.authoring.widgets',
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
                    personal: true,
                },
            });
        },
    ])

    .controller('SuggestionsCtrl', SuggestionsCtrl);
