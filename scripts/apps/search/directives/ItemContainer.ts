import {IArticle} from 'superdesk-api';

interface IScope extends ng.IScope {
    value: string;
    label: string;
    item: IArticle;
}

ItemContainer.$inject = ['desks'];
export function ItemContainer(desks) {
    return {
        scope: {
            item: '=',
        },
        template: '<span class="location-desk-label sd-list-item__text-label">{{label}}</span> {{value}}',
        link: function(scope: IScope, elem) {
            if (scope.item._type !== 'ingest') {
                if (scope.item.task && scope.item.task.desk) {
                    desks.initialize().then(() => {
                        if (desks.deskLookup[scope.item.task.desk]) {
                            scope.label = 'desk:';
                            scope.value = desks.deskLookup[scope.item.task.desk].name;
                        }
                    });
                } else if (scope.item._type === 'archive') {
                    scope.label = 'location:';
                    scope.value = 'workspace';
                } else if (scope.item._type === 'archived') {
                    scope.label = '';
                    scope.value = 'archived';
                }
            }
        },
    };
}
