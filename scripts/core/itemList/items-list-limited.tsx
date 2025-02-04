/* eslint-disable react/no-multi-comp */

import React from 'react';
import ng from 'core/services/ng';
import {ItemList} from 'apps/search/components/ItemList';
import {noop} from 'lodash';
import {
    IArticle,
    IWebsocketMessage,
    IResourceCreatedEvent,
    IResourceUpdateEvent,
    IResourceDeletedEvent,
    IResourceChange,
} from 'superdesk-api';
import {dataApi} from 'core/helpers/CrudManager';
import {
    IRelatedEntities,
    getAndMergeRelatedEntitiesForArticles,
    getAndMergeRelatedEntitiesUpdated,
} from 'core/getRelatedEntities';
import {throttleAndCombineArray} from './throttleAndCombine';
import {addWebsocketEventListener} from 'core/notification/notification';

interface IProps {
    ids: Array<IArticle['_id']>;
    onItemClick(item: IArticle): void;
}

interface IState {
    items: Array<IArticle>;
    relatedEntities: IRelatedEntities;
}

// DOES NOT SUPPORT item actions, pagination, multiselect
class ItemsListLimitedComponent extends React.Component<IProps, IState> {
    monitoringState: any;
    private abortController: AbortController;
    private handleContentChanges: (changes: Array<IResourceChange>) => void;
    private eventListenersToRemoveBeforeUnmounting: Array<() => void>;

    constructor(props: any) {
        super(props);

        this.state = {
            items: null,
            relatedEntities: {},
        };

        this.monitoringState = ng.get('monitoringState');
        this.abortController = new AbortController();

        this.eventListenersToRemoveBeforeUnmounting = [];

        this.handleContentChanges = throttleAndCombineArray(
            (changes) => {
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
    }
    componentDidMount() {
        const {ids} = this.props;

        this.monitoringState.init().then(() => {
            Promise.all(ids.map((id) => dataApi.findOne<IArticle>('search', id)))
                .then((items) => {
                    getAndMergeRelatedEntitiesForArticles(
                        items,
                        this.state.relatedEntities,
                        this.abortController.signal,
                    ).then((relatedEntities) => {
                        this.setState({
                            items,
                            relatedEntities,
                        });
                    });
                });
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
        this.abortController.abort();

        this.eventListenersToRemoveBeforeUnmounting.forEach((removeListener) => {
            removeListener();
        });
    }
    render() {
        const {items} = this.state;

        if (items == null) {
            return null;
        }

        const itemsById = items.reduce<{[key: string]: IArticle}>((acc, value) => {
            acc[value._id] = value;

            return acc;
        }, {});

        return (
            <ItemList
                itemsList={Object.keys(itemsById)}
                itemsById={itemsById}
                relatedEntities={this.state.relatedEntities}
                profilesById={this.monitoringState.state.profilesById}
                highlightsById={this.monitoringState.state.highlightsById}
                markedDesksById={this.monitoringState.state.markedDesksById}
                desksById={this.monitoringState.state.desksById}
                ingestProvidersById={this.monitoringState.state.ingestProvidersById}
                usersById={this.monitoringState.state.usersById}
                onMonitoringItemSelect={(item) => {
                    this.props.onItemClick(item);
                }}
                onMonitoringItemDoubleClick={(item) => {
                    this.props.onItemClick(item);
                }}
                hideActionsForMonitoringItems={true}
                singleLine={false}
                customRender={undefined}
                flags={{hideActions: true}}
                loading={false}
                viewColumn={undefined}
                groupId={undefined}
                edit={noop}
                preview={noop}
                narrow={false}
                view={undefined}
                selected={undefined}
                swimlane={false}
                scopeApply={(fn) => fn()}
                scopeApplyAsync={(fn) => fn()}
            />
        );
    }
}

export class ItemsListLimited extends React.Component<IProps> {
    render() {
        const {ids, onItemClick} = this.props;
        const key = JSON.stringify(ids); // re-mount when ids change

        return (
            <ItemsListLimitedComponent
                key={key}
                ids={ids}
                onItemClick={onItemClick}
            />
        );
    }
}
