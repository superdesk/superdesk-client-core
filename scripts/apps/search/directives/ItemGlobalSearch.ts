ItemGlobalSearch.$inject = [
    'session', 'api', 'notify', 'gettext', 'keyboardManager', 'asset', 'authoringWorkspace', 'authoring',
];

/**
 * Open Item dialog
 */
export function ItemGlobalSearch(
    session, api, notify, gettext, keyboardManager, asset, authoringWorkspace, authoring
) {
    return {
        scope: {repo: '=', context: '='},
        templateUrl: asset.templateUrl('apps/search/views/item-globalsearch.html'),
        link: function(scope, elem) {
            var ENTER = 13;
            var ESC = 27;

            scope.meta = {};
            scope.flags = {enabled: false};
            keyboardManager.bind('ctrl+0', () => {
                scope.flags.enabled = true;
            }, {global: true});
            keyboardManager.bind('esc', () => {
                scope.flags.enabled = false;
            }, {global: true});

            scope.$on('$destroy', () => {
                keyboardManager.unbind('ctrl+0');
                keyboardManager.unbind('esc');
            });

            function reset() {
                scope.meta.unique_name = '';
            }

            function openItem(items) {
                if (items.length > 0) {
                    reset();
                    scope.flags.enabled = false;
                    if (authoring.itemActions(items[0]).edit) {
                        authoringWorkspace.edit(items[0]);
                    } else {
                        authoringWorkspace.view(items[0]);
                    }
                } else {
                    notify.error(gettext('Item not found...'));
                    scope.flags.enabled = true;
                }
            }
            function searchUserContent(criteria) {
                var resource = api('user_content', session.identity);

                resource.query(criteria).then((result) => {
                    openItem(result._items);
                }, (response) => {
                    scope.message = gettext('There was a problem, item can not open.');
                });
            }
            function fetchItem() {
                var filter = [
                    {not: {term: {state: 'spiked'}}},
                    {bool:
                    {should: [{term: {unique_name: scope.meta.unique_name}},
                        {term: {_id: scope.meta.unique_name}},
                        {term: {guid: scope.meta.unique_name}},
                        {term: {item_id: scope.meta.unique_name}},
                    ]},
                    },
                ];
                var criteria = {
                    repo: 'archive,published,archived',
                    source: {
                        query: {filtered: {filter: {
                            and: filter,
                        }}},
                    },
                };

                api.query('search', criteria).then((result) => {
                    scope.items = result._items;
                    if (scope.items.length > 0) {
                        openItem(scope.items);
                        reset();
                    } else {
                        searchUserContent(criteria);
                    }
                }, (response) => {
                    scope.message = gettext('There was a problem, item can not open.');
                });
            }

            scope.search = function() {
                fetchItem();
            };
            scope.openOnEnter = function($event) {
                if ($event.keyCode === ENTER) {
                    scope.search();
                    $event.stopPropagation();
                }
                if ($event.keyCode === ESC) {
                    _closeDialog();
                }
            };

            scope.close = function() {
                _closeDialog();
            };

            function _closeDialog() {
                reset();
                scope.flags.enabled = false;
            }
        },
    };
}
