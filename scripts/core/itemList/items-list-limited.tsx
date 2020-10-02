/* eslint-disable react/no-multi-comp */

import React from 'react';
import ng from 'core/services/ng';
import {ItemList} from 'apps/search/components/ItemList';
import {noop} from 'lodash';
import {IArticle} from 'superdesk-api';
import {dataApi} from 'core/helpers/CrudManager';

interface IProps {
    ids: Array<IArticle['_id']>;
    onItemClick(item: IArticle): void;
}

interface IState {
    items: Array<IArticle>;
}

// DOES NOT SUPPORT item actions, pagination, multiselect
class ItemsListLimitedComponent extends React.Component<IProps, IState> {
    monitoringState: any;

    constructor(props: any) {
        super(props);

        this.state = {
            items: null,
        };

        this.monitoringState = ng.get('monitoringState');
    }
    componentDidMount() {
        const {ids} = this.props;

        this.monitoringState.init().then(() => {
            Promise.all(ids.map((id) => dataApi.findOne<IArticle>('search', id)))
                .then((items) => {
                    this.setState({items});
                });
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
                disableMonitoringMultiSelect={true}
                singleLine={false}
                customRender={undefined}
                viewType={undefined}
                flags={{hideActions: true}}
                loading={false}
                viewColumn={undefined}
                groupId={undefined}
                edit={noop}
                preview={noop}
                multiSelect={noop}
                setSelectedItem={noop}
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
