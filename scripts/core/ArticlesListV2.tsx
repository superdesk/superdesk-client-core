/* eslint-disable react/no-multi-comp */

import React from 'react';
import ng from 'core/services/ng';
import {
    IArticle,
    IResourceUpdateEvent,
    IWebsocketMessage,
    IResourceCreatedEvent,
    IResourceDeletedEvent,
    IResourceChange,
} from 'superdesk-api';

import {noop} from 'lodash';
import {LazyLoader} from './itemList/LazyLoader';
import {IMultiSelectNew, ItemList} from 'apps/search/components/ItemList';
import {addWebsocketEventListener} from './notification/notification';
import {dataApi} from './helpers/CrudManager';
import {IScope} from 'angular';
import {ARTICLE_RELATED_RESOURCE_NAMES} from './constants';
import {OrderedMap} from 'immutable';
import {openArticle} from './get-superdesk-api-implementation';
import {
    getAndMergeRelatedEntitiesForArticles,
    IRelatedEntities,
    getAndMergeRelatedEntitiesUpdated,
} from './getRelatedEntities';
import {SuperdeskReactComponent} from './SuperdeskReactComponent';
import {notNullOrUndefined} from './helpers/typescript-helpers';
import {throttleAndCombineArray} from './itemList/throttleAndCombine';

interface IState {
    initialized: boolean;
    selected: IArticle['_id'] | undefined;
    relatedEntities: IRelatedEntities;
}

interface IProps {
    itemCount: number;
    pageSize: number;
    padding?: string;
    loadItems(start: number, end: number): Promise<Array<IArticle>>;
    shouldReloadTheList?(fieldsChanged: Set<string>): boolean;

    onItemClick(item: IArticle): void;
    onItemDoubleClick?(item: IArticle): void;
    getMultiSelect?: (items: OrderedMap<string, IArticle>) => IMultiSelectNew;
}

/**
 * "Track By" ids are a workaround to published items having _id set
 * to a an _id of the original story (_id from archive endpoint). If an update is created,
 * /search endpoint will return 2 items with the same _id
 */
type ITrackById = string;

export class ArticlesListV2 extends SuperdeskReactComponent<IProps, IState> {
    private monitoringState: any;
    private lazyLoaderRef: LazyLoader<IArticle>;
    private handleContentChanges: (changes: Array<IResourceChange>) => void;
    private eventListenersToRemoveBeforeUnmounting: Array<() => void>;
    private _mounted: boolean;
    private services: {search: any};

    // required for updating the list after receiving a websocket notification
    // notifications return real _id, but LazyLoader works with ITrackById
    private idMap: Map<IArticle['_id'], ITrackById>;

    constructor(props: any) {
        super(props);

        this.state = {
            initialized: false,
            selected: undefined,
            relatedEntities: {},
        };

        this.monitoringState = ng.get('monitoringState');

        this.fetchRelatedEntities = this.fetchRelatedEntities.bind(this);
        this.loadMore = this.loadMore.bind(this);
        this.getItemsByIds = this.getItemsByIds.bind(this);
        this.reloadList = this.reloadList.bind(this);

        this.handleContentChanges = throttleAndCombineArray(
            (changes) => {
                if (this.lazyLoaderRef == null) {
                    return;
                }

                const articlesResourceChanges = changes.filter(
                    ({resource}) => ARTICLE_RELATED_RESOURCE_NAMES.includes(resource),
                );

                // update articles in the list
                if (articlesResourceChanges.length > 0) {
                    const fields = articlesResourceChanges.reduce((acc, item) => {
                        Object.keys(item.fields ?? {}).forEach((field) => {
                            acc.add(field);
                        });

                        return acc;
                    }, new Set<string>());

                    const reloadTheList = this.props?.shouldReloadTheList(fields) ?? false;

                    if (reloadTheList || fields == null) {
                        this.lazyLoaderRef.reset();
                        this.idMap.clear();
                    } else {
                        const trackByIds: Array<string> = articlesResourceChanges
                            .map(({itemId}) => this.idMap.get(itemId))
                            .filter(notNullOrUndefined);

                        if (trackByIds.length > 0) {
                            this.lazyLoaderRef.updateItems(new Set<string>(trackByIds));
                        }
                    }
                }

                getAndMergeRelatedEntitiesUpdated(
                    this.state.relatedEntities,
                    changes,
                    this.abortController.signal,
                ).then((relatedEntities) => {
                    this.setState({relatedEntities});
                });
            },
            300,
        );

        this.idMap = new Map<IArticle['_id'], ITrackById>();

        this.services = {
            search: ng.get('search'),
        };

        this.eventListenersToRemoveBeforeUnmounting = [];
    }

    public reloadList() {
        this.lazyLoaderRef?.reset();
        this.idMap?.clear();
    }

    fetchRelatedEntities(items: OrderedMap<ITrackById, IArticle>): Promise<OrderedMap<ITrackById, IArticle>> {
        const articles: Array<IArticle> = [];

        items.forEach((item) => {
            articles.push(item);
        });

        return new Promise((resolve) => {
            getAndMergeRelatedEntitiesForArticles(
                articles,
                this.state.relatedEntities,
                this.abortController.signal,
            ).then((relatedEntities) => {
                this.setState({
                    relatedEntities,
                }, () => {
                    resolve(items);
                });
            });
        });
    }

    loadMore(from: number, to: number): Promise<OrderedMap<ITrackById, IArticle>> {
        const {loadItems} = this.props;

        return new Promise<OrderedMap<ITrackById, IArticle>>((resolve) => {
            loadItems(from, to).then((items) => {
                let result = OrderedMap<ITrackById, IArticle>();

                items.forEach((item) => {
                    const trackById: ITrackById = this.services.search.generateTrackByIdentifier(item);

                    this.idMap.set(item._id, trackById);

                    result = result.set(trackById, item);
                });

                resolve(result);
            });
        }).then(this.fetchRelatedEntities);
    }

    getItemsByIds(trackByIds: Array<string>): Promise<OrderedMap<ITrackById, IArticle>> {
        const {services} = this;
        const ids = trackByIds.map((x) => services.search.extractIdFromTrackByIndentifier(x));

        return Promise.all(
            ids.map((id) => dataApi.findOne<IArticle>('search', id)),
        ).then((items) => {
            let result = OrderedMap<ITrackById, IArticle>();

            items.forEach((item) => {
                const trackById = services.search.generateTrackByIdentifier(item);

                this.idMap.set(item._id, trackById);

                result = result.set(trackById, item);
            });

            return result;
        }).then(this.fetchRelatedEntities);
    }

    componentDidMount() {
        this._mounted = true;

        this.monitoringState.init().then(() => {
            if (this._mounted) {
                this.setState({initialized: true});
            }
        });

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

        this.eventListenersToRemoveBeforeUnmounting.forEach((removeListener) => {
            removeListener();
        });
    }

    render() {
        if (this.state.initialized !== true) {
            return null;
        }

        const {itemCount, pageSize} = this.props;
        const {services} = this;

        return (
            <LazyLoader
                itemCount={itemCount}
                loadMoreItems={this.loadMore}
                pageSize={pageSize}
                getItemsByIds={this.getItemsByIds}
                ref={(component) => {
                    this.lazyLoaderRef = component;
                }}
                padding={this.props.padding}
                data-test-id="articles-list"
            >
                {(items) => {
                    return (
                        <ItemList
                            itemsList={items.keySeq().toJS()}
                            itemsById={items.toJS()}
                            relatedEntities={this.state.relatedEntities}
                            profilesById={this.monitoringState.state.profilesById}
                            highlightsById={this.monitoringState.state.highlightsById}
                            markedDesksById={this.monitoringState.state.markedDesksById}
                            desksById={this.monitoringState.state.desksById}
                            ingestProvidersById={this.monitoringState.state.ingestProvidersById}
                            usersById={this.monitoringState.state.usersById}
                            onMonitoringItemSelect={(item) => {
                                this.setState({selected: services.search.generateTrackByIdentifier(item)});
                                this.props.onItemClick(item);
                            }}
                            onMonitoringItemDoubleClick={this.props.onItemDoubleClick ?? noop}
                            hideActionsForMonitoringItems={false}
                            singleLine={false}
                            customRender={undefined}
                            flags={{hideActions: false}}
                            loading={false}
                            viewColumn={undefined}
                            groupId={undefined}
                            edit={(item) => {
                                openArticle(item._id, 'edit');
                            }}
                            preview={noop}
                            multiSelect={this.props.getMultiSelect(items)}
                            narrow={false}
                            view={undefined}
                            selected={this.state.selected}
                            swimlane={false}
                            scopeApply={(fn) => {
                                const $rootScope: IScope = ng.get('$rootScope');

                                $rootScope.$apply(fn);
                            }}
                            scopeApplyAsync={(fn) => {
                                const $rootScope: IScope = ng.get('$rootScope');

                                $rootScope.$applyAsync(fn);
                            }}
                        />
                    );
                }}
            </LazyLoader>
        );
    }
}
