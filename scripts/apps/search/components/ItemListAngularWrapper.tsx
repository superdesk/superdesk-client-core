import React from 'react';
import {forOwn, startsWith, indexOf} from 'lodash';
import ng from 'core/services/ng';
import {ItemList} from 'apps/search/components';
import {
    IArticle,
    IWebsocketMessage,
    IResourceCreatedEvent,
    IResourceUpdateEvent,
    IResourceDeletedEvent,
    IResourceChange,
} from 'superdesk-api';
import {
    IRelatedEntities,
    getAndMergeRelatedEntitiesForArticles,
    getAndMergeRelatedEntitiesUpdated,
} from 'core/getRelatedEntities';
import {addWebsocketEventListener} from 'core/notification/notification';
import {throttleAndCombineArray} from 'core/itemList/throttleAndCombine';
import {isCheckAllowed} from '../helpers';
import {SmoothLoader} from './SmoothLoader';

interface IProps {
    scope: any;
    monitoringState: any;
}

interface IState {
    narrow: boolean;
    view: 'compact' | 'mgrid' | 'photogrid';
    itemsList: Array<string>;
    itemsById: {[key: string]: IArticle};
    relatedEntities: IRelatedEntities;
    selected: string;
    swimlane: any;
    actioning: {};
    loading: boolean;
}

export class ItemListAngularWrapper extends React.Component<IProps, IState> {
    componentRef: ItemList;
    private abortController: AbortController;
    private eventListenersToRemoveBeforeUnmounting: Array<() => void>;
    private handleContentChanges: (changes: Array<IResourceChange>) => void;
    private _mounted: boolean;

    constructor(props: IProps) {
        super(props);

        this.state = {
            itemsList: [],
            itemsById: {},
            relatedEntities: {},
            selected: null,
            view: 'compact',
            narrow: false,
            swimlane: null,
            actioning: {},
            loading: true,
        };

        this.focus = this.focus.bind(this);
        this.setActioning = this.setActioning.bind(this);
        this.findItemByPrefix = this.findItemByPrefix.bind(this);
        this.setNarrowView = this.setNarrowView.bind(this);
        this.updateItem = this.updateItem.bind(this);
        this.updateAllItems = this.updateAllItems.bind(this);
        this.multiSelect = this.multiSelect.bind(this);
        this.selectMultipleItems = this.selectMultipleItems.bind(this);

        this.abortController = new AbortController();
        this.eventListenersToRemoveBeforeUnmounting = [];

        this.handleContentChanges = throttleAndCombineArray(
            (changes) => {
                getAndMergeRelatedEntitiesUpdated(
                    this.state.relatedEntities,
                    changes,
                    this.abortController.signal,
                ).then((relatedEntities) => {
                    if (this._mounted) {
                        this.setState({relatedEntities});
                    }
                });
            },
            300,
        );
    }

    focus() {
        this.componentRef?.focus();
    }

    setActioning(item: IArticle, isActioning: boolean) {
        this.componentRef?.setActioning(item, isActioning);
    }

    findItemByPrefix(prefix) {
        let item;

        forOwn(this.state.itemsById, (val, key) => {
            if (startsWith(key, prefix)) {
                item = val;
            }
        });

        return item;
    }

    setNarrowView(setNarrow) {
        this.setState({narrow: setNarrow});
    }

    updateItem(itemId, changes) {
        const item = this.state.itemsById[itemId] || null;

        if (item) {
            const itemsById = angular.extend({}, this.state.itemsById);
            const updatedItem: IArticle = angular.extend({}, item, changes);

            itemsById[itemId] = updatedItem;

            getAndMergeRelatedEntitiesForArticles(
                [updatedItem],
                this.state.relatedEntities,
                this.abortController.signal,
            ).then((relatedEntities) => {
                this.setState({
                    itemsById,
                    relatedEntities,
                });
            });
        }
    }

    updateAllItems(itemId, changes) {
        const itemsById = angular.extend({}, this.state.itemsById);
        const updatedItems = [];

        forOwn(itemsById, (value, key) => {
            if (startsWith(key, itemId)) {
                itemsById[key] = angular.extend({}, value, changes);
                updatedItems.push(itemsById[key]);
            }
        });

        getAndMergeRelatedEntitiesForArticles(
            updatedItems,
            this.state.relatedEntities,
            this.abortController.signal,
        ).then((relatedEntities) => {
            this.setState({
                itemsById,
                relatedEntities,
            });
        });
    }

    selectMultipleItems(lastItem: IArticle) {
        const {itemsList, itemsById, selected} = this.state;

        const search = ng.get('search');
        const itemId = search.generateTrackByIdentifier(lastItem);
        let positionStart = 0;
        const positionEnd = indexOf(itemsList, itemId);
        const selectedItems = [];

        if (selected) {
            positionStart = indexOf(itemsList, selected);
        }

        const start = Math.min(positionStart, positionEnd);
        const end = Math.max(positionStart, positionEnd);

        for (let i = start; i <= end; i++) {
            const item = itemsById[itemsList[i]];

            if (isCheckAllowed(item)) {
                selectedItems.push(item);
            }
        }

        this.multiSelect(selectedItems, true);
    }

    multiSelect(items: Array<IArticle>, selected: boolean) {
        const search = ng.get('search');
        const multi = ng.get('multi');

        let {selected: selectedId} = this.state;

        const itemsById = angular.extend({}, this.state.itemsById);

        items.forEach((item, i) => {
            const itemId = search.generateTrackByIdentifier(item);

            if (selected && i === items.length - 1) {
                // Mark last item as selected
                selectedId = itemId;
            }
            itemsById[itemId] = angular.extend({}, item, {selected: selected});
            this.props.scope.$applyAsync(() => {
                multi.toggle(itemsById[itemId]);
            });
        });

        this.setState({itemsById, selected: selectedId});
    }

    componentDidMount() {
        this._mounted = true;

        this.eventListenersToRemoveBeforeUnmounting.push(
            addWebsocketEventListener(
                'resource:created',
                (event: IWebsocketMessage<IResourceCreatedEvent>) => {
                    const {resource, _id} = event.extra;

                    this.handleContentChanges([{changeType: 'created', resource: resource, itemId: _id}]);
                },
            ),
        );

        this.eventListenersToRemoveBeforeUnmounting.push(
            addWebsocketEventListener(
                'resource:updated',
                (event: IWebsocketMessage<IResourceUpdateEvent>) => {
                    const {resource, _id, fields} = event.extra;

                    this.handleContentChanges([{changeType: 'updated', resource: resource, itemId: _id, fields}]);
                },
            ),
        );

        this.eventListenersToRemoveBeforeUnmounting.push(
            addWebsocketEventListener(
                'resource:deleted',
                (event: IWebsocketMessage<IResourceDeletedEvent>) => {
                    const {resource, _id} = event.extra;

                    this.handleContentChanges([{changeType: 'deleted', resource: resource, itemId: _id}]);
                },
            ),
        );
    }

    componentWillUnmount() {
        this._mounted = false;

        this.abortController.abort();

        this.eventListenersToRemoveBeforeUnmounting.forEach((removeListener) => {
            removeListener();
        });
    }

    render() {
        const {scope, monitoringState} = this.props;

        const style = scope.styleProperties == null
            ? null

            // styleProperties will be modified on the angular side so it can not be directly used as a react prop.
            : Object.assign({}, scope.styleProperties);

        return (
            <div style={style}>
                <ItemList
                    itemsList={this.state.itemsList}
                    itemsById={this.state.itemsById}
                    relatedEntities={this.state.relatedEntities}
                    profilesById={monitoringState.state.profilesById}
                    highlightsById={monitoringState.state.highlightsById}
                    markedDesksById={monitoringState.state.markedDesksById}
                    desksById={monitoringState.state.desksById}
                    ingestProvidersById={monitoringState.state.ingestProvidersById}
                    usersById={monitoringState.state.usersById}
                    onMonitoringItemSelect={scope.onMonitoringItemSelect}
                    onMonitoringItemDoubleClick={scope.onMonitoringItemDoubleClick}
                    hideActionsForMonitoringItems={scope.hideActionsForMonitoringItems}
                    singleLine={scope.singleLine}
                    customRender={scope.customRender}
                    flags={scope.flags}
                    loading={this.state.loading}
                    viewColumn={scope.viewColumn}
                    groupId={scope.$id}
                    edit={scope.edit}
                    preview={scope.preview}
                    multiSelect={scope.disableMonitoringMultiSelect ? undefined : {
                        kind: 'legacy',
                        multiSelect: (item: IArticle, selected: boolean, multiSelectMode: boolean) => {
                            if (multiSelectMode) {
                                this.selectMultipleItems(item);
                            } else {
                                this.multiSelect([item], selected);
                            }
                        },
                        setSelectedItem: (itemId) => {
                            this.setState({selected: itemId});
                        },
                    }}
                    narrow={this.state.narrow}
                    view={this.state.view}
                    selected={this.state.selected}
                    swimlane={this.state.swimlane}
                    scopeApply={(callback) => {
                        scope.$apply(callback);
                    }}
                    scopeApplyAsync={(callback) => {
                        scope.$applyAsync(callback);
                    }}
                    ref={(component) => {
                        this.componentRef = component;
                    }}
                />
            </div>
        );
    }
}
