/* eslint-disable react/no-multi-comp */

import React from 'react';
import ng from 'core/services/ng';
import {ItemList} from 'apps/search/components/ItemList';
import {noop} from 'lodash';
import {IArticle} from 'superdesk-api';
import {dataApi} from 'core/helpers/CrudManager';
import {IRelatedEntities, getRelatedEntities, mergeRelatedEntities} from 'core/getRelatedEntities';

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

    constructor(props: any) {
        super(props);

        this.state = {
            items: null,
            relatedEntities: {},
        };

        this.monitoringState = ng.get('monitoringState');
        this.abortController = new AbortController();
    }
    componentDidMount() {
        const {ids} = this.props;

        this.monitoringState.init().then(() => {
            Promise.all(ids.map((id) => dataApi.findOne<IArticle>('search', id)))
                .then((items) => {
                    getRelatedEntities(
                        items,
                        this.state.relatedEntities,
                        this.abortController.signal,
                    ).then((relatedEntities) => {
                        this.setState({
                            items,
                            relatedEntities: mergeRelatedEntities(this.state.relatedEntities, relatedEntities),
                        });
                    });
                });
        });
    }
    componentWillUnmount() {
        this.abortController.abort();
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
