import _ from 'lodash';
import {gettext} from 'core/utils';

ArchivedItemKill.$inject = ['authoring', 'api', 'notify'];

export function ArchivedItemKill(authoring, api, notify) {
    return {
        templateUrl: 'scripts/apps/archive/views/archived-kill.html',
        scope: {
            item: '=',
            action: '=',
        },
        link: function(scope, elem, attr) {
            scope._editable = true;

            var itemToDelete = {_id: scope.item._id, _etag: scope.item._etag};

            api.remove(itemToDelete, {}, 'archived').then(
                (response) => {
                    var fields = _.union(_.keys(authoring.getContentFieldDefaults()), ['_id', 'versioncreated']);
                    var itemForTemplate = {template_name: scope.action, item: _.pick(scope.item, fields)};

                    api.save('content_templates_apply', {}, itemForTemplate, {}).then((result) => {
                        itemForTemplate = _.pick(result, _.keys(authoring.getContentFieldDefaults()));
                        scope.item = _.create(scope.item);
                        _.each(itemForTemplate, (value, key) => {
                            if (!_.isUndefined(value) && !_.isEmpty(value)) {
                                scope.item[key] = value;
                            }
                        });
                        scope.item['operation'] = scope.action;
                    }, (err) => {
                        notify.error(gettext('Failed to apply kill template to the item.'));
                    });
                }, (response) => {
                    if (response.data._message) {
                        notify.error(response.data._message);
                    } else {
                        notify.error(gettext('Unknown Error: Cannot kill the item'));
                    }
                }
            );

            scope.kill = function() {
                api.save('archived', scope.item, _.pick(scope.item, ['headline', 'abstract', 'body_html', 'operation']))
                    .then((response) => {
                        notify.success(gettext('Item has been killed.'));
                        scope.cancel();
                    });
            };

            scope.cancel = function() {
                scope.item = null;
            };
        },
    };
}
