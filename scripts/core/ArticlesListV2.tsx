/* eslint-disable react/no-multi-comp */

import React from 'react';
import ng from 'core/services/ng';
import {
    IArticle,
    IResourceUpdateEvent,
    IWebsocketMessage,
    IResourceCreatedEvent,
    IResourceDeletedEvent,
} from 'superdesk-api';

import {noop} from 'lodash';
import {LazyLoader} from './itemList/LazyLoader';
import {IMultiSelectNew, ItemList} from 'apps/search/components/ItemList';
import {addWebsocketEventListener} from './notification/notification';
import {dataApi} from './helpers/CrudManager';
import {IScope} from 'angular';

interface IState {
    initialized: boolean;
}

interface IProps {
    itemCount: number;
    pageSize: number;
    padding?: string;
    loadItems(start: number, end: number): Promise<Array<IArticle>>;
    shouldReloadTheList?(fieldsChanged: Set<string>): boolean;

    onItemClick(item: IArticle): void;
    onItemDoubleClick?(item: IArticle): void;
    multiSelect?: IMultiSelectNew;
}

export class ArticlesListV2 extends React.Component<IProps, IState> {
    monitoringState: any;
    lazyLoaderRef: LazyLoader<IArticle>;
    handleContentChanges: (resource: string, itemId: string, fields?: {[key: string]: 1}) => void;
    removeResourceCreatedListener: () => void;
    removeContentUpdateListener: () => void;
    removeResourceDeletedListener: () => void;

    constructor(props: any) {
        super(props);

        this.state = {
            initialized: false,
        };

        this.monitoringState = ng.get('monitoringState');

        this.loadMore = this.loadMore.bind(this);

        this.handleContentChanges = (resource: string, itemId: string, fields?: {[key: string]: 1}) => {
            if (
                resource === 'archive'
                || resource === 'archive_spike'
                || resource === 'archive_unspike'
            ) {
                const reloadTheList = this.props?.shouldReloadTheList(
                    new Set(Object.keys(fields ?? {})),
                ) ?? false;

                if (reloadTheList || fields == null) {
                    this.lazyLoaderRef.reset();
                } else {
                    this.lazyLoaderRef.updateItems(new Set([itemId]));
                }
            }
        };
    }

    loadMore(from: number, to: number) {
        const {loadItems} = this.props;

        return new Promise<Dictionary<string, IArticle>>((resolve) => {
            loadItems(from, to).then((items) => {
                const patch = items.reduce<{[key: string]: IArticle}>((acc, item, index) => {
                    acc[from + index] = item;

                    return acc;
                }, {});

                resolve(patch);
            });
        });
    }

    componentDidMount() {
        this.monitoringState.init().then(() => {
            this.setState({initialized: true});
        });
    }

    componentWillUnmount() {
        this.removeResourceCreatedListener();
        this.removeContentUpdateListener();
        this.removeResourceDeletedListener();
    }

    render() {
        if (this.state.initialized !== true) {
            return null;
        }

        const {itemCount, pageSize} = this.props;

        return (
            <LazyLoader
                itemCount={itemCount}
                loadMoreItems={this.loadMore}
                pageSize={pageSize}
                getId={(item) => item._id}
                getItemsByIds={(ids) => {
                    return Promise.all(
                        ids.map((id) => dataApi.findOne<IArticle>('search', id)),
                    );
                }}
                ref={(component) => {
                    this.lazyLoaderRef = component;

                    if (this.lazyLoaderRef != null && this.removeContentUpdateListener == null) {
                        // wouldn't work in componentDidMount, because this.state.loading would be true
                        // and LazyLoader wouldn't be mounted at that point yet.

                        this.removeResourceCreatedListener = addWebsocketEventListener(
                            'resource:created',
                            (event: IWebsocketMessage<IResourceCreatedEvent>) => {
                                const {resource, _id} = event.extra;

                                this.handleContentChanges(resource, _id);
                            },
                        );

                        this.removeContentUpdateListener = addWebsocketEventListener(
                            'resource:updated',
                            (event: IWebsocketMessage<IResourceUpdateEvent>) => {
                                const {resource, _id, fields} = event.extra;

                                this.handleContentChanges(resource, _id, fields);
                            },
                        );

                        this.removeResourceDeletedListener = addWebsocketEventListener(
                            'resource:deleted',
                            (event: IWebsocketMessage<IResourceDeletedEvent>) => {
                                const {resource, _id} = event.extra;

                                this.handleContentChanges(resource, _id);
                            },
                        );
                    }
                }}
                padding={this.props.padding}
                data-test-id="articles-list"
            >
                {(items) => {
                    return (
                        <ItemList
                            itemsList={Object.keys(items)}
                            itemsById={items}
                            profilesById={this.monitoringState.state.profilesById}
                            highlightsById={this.monitoringState.state.highlightsById}
                            markedDesksById={this.monitoringState.state.markedDesksById}
                            desksById={this.monitoringState.state.desksById}
                            ingestProvidersById={this.monitoringState.state.ingestProvidersById}
                            usersById={this.monitoringState.state.usersById}
                            onMonitoringItemSelect={this.props.onItemClick}
                            onMonitoringItemDoubleClick={this.props.onItemDoubleClick ?? noop}
                            hideActionsForMonitoringItems={false}
                            singleLine={false}
                            customRender={undefined}
                            flags={{hideActions: false}}
                            loading={false}
                            viewColumn={undefined}
                            groupId={undefined}
                            edit={noop}
                            preview={noop}
                            multiSelect={this.props.multiSelect}
                            narrow={false}
                            view={undefined}
                            selected={undefined}
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
