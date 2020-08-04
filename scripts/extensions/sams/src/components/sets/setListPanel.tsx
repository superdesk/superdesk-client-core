import * as React from 'react';

import {ISamsAPI, ISetItem, IStorageDestinationItem} from '../../interfaces';
import {ISuperdesk} from 'superdesk-api';
import {SET_STATE, EVENTS} from '../../constants';

import {SetListGroup} from './setListGroup';

interface IProps {
    storageDestinations: {[key: string]: IStorageDestinationItem};
    onItemClicked(set: ISetItem): void;
    onDelete(set: ISetItem): void;
    onEdit(set: ISetItem): void;
    currentSetId?: string;
}

type ISetArrays = {
    draft: Array<ISetItem>;
    usable: Array<ISetItem>;
    disabled: Array<ISetItem>;
};

interface IState {
    sets?: ISetArrays;
}

export function getSetListPanel(superdesk: ISuperdesk, api: ISamsAPI) {
    const {gettext} = superdesk.localization;

    return class SetListPanel extends React.Component<IProps, IState> {
        constructor(props: IProps) {
            super(props);

            this.state = {
                sets: {
                    draft: [],
                    usable: [],
                    disabled: [],
                },
            };

            this.loadSets = this.loadSets.bind(this);
            this.onSetsChanged = this.onSetsChanged.bind(this);
        }

        componentDidMount() {
            this.loadSets();
            window.addEventListener(EVENTS.SET_CREATED, this.onSetsChanged as EventListener);
            window.addEventListener(EVENTS.SET_UPDATED, this.onSetsChanged as EventListener);
            window.addEventListener(EVENTS.SET_DELETED, this.onSetsChanged as EventListener);
        }

        componentWillUnmount() {
            window.removeEventListener(EVENTS.SET_CREATED, this.onSetsChanged as EventListener);
            window.removeEventListener(EVENTS.SET_UPDATED, this.onSetsChanged as EventListener);
            window.removeEventListener(EVENTS.SET_DELETED, this.onSetsChanged as EventListener);
        }

        onSetsChanged(_e: CustomEvent<ISetItem>) {
            this.loadSets();
        }

        loadSets() {
            api.sets.getAll()
                .then((items: Array<ISetItem>) => {
                    const sets: ISetArrays = {
                        draft: [],
                        usable: [],
                        disabled: [],
                    };

                    items.forEach((set: ISetItem) => {
                        if (set.destination_name != null) {
                            set.destination = this.props.storageDestinations[set.destination_name];
                        }

                        switch (set.state) {
                        case SET_STATE.USABLE:
                            sets.usable.push(set);
                            break;
                        case SET_STATE.DISABLED:
                            sets.disabled.push(set);
                            break;
                        case SET_STATE.DRAFT:
                        default:
                            sets.draft.push(set);
                            break;
                        }
                    });

                    function sortSet(set1: ISetItem, set2: ISetItem) {
                        const set1Name = (set1?.name ?? '').toLowerCase();
                        const set2Name = (set2?.name ?? '').toLowerCase();

                        if (set1Name > set2Name) {
                            return 1;
                        } else if (set1Name < set2Name) {
                            return -1;
                        }
                        return 0;
                    }

                    sets.draft = sets.draft.sort(sortSet);
                    sets.usable = sets.usable.sort(sortSet);
                    sets.disabled = sets.disabled.sort(sortSet);

                    this.setState({sets: sets});
                });
        }

        render() {
            return (
                <React.Fragment>
                    <SetListGroup
                        title={gettext('Draft Sets')}
                        noItemTitle={gettext('No draft sets configured')}
                        sets={this.state.sets?.draft ?? []}
                        storageDestinations={this.props.storageDestinations}
                        onItemClicked={this.props.onItemClicked}
                        onDelete={this.props.onDelete}
                        onEdit={this.props.onEdit}
                        currentSetId={this.props.currentSetId}
                    />
                    <SetListGroup
                        title={gettext('Usable Sets')}
                        noItemTitle={gettext('No usable sets configured')}
                        marginTop={true}
                        sets={this.state.sets?.usable ?? []}
                        storageDestinations={this.props.storageDestinations}
                        onItemClicked={this.props.onItemClicked}
                        onEdit={this.props.onEdit}
                        currentSetId={this.props.currentSetId}
                    />
                    <SetListGroup
                        title={gettext('Disabled Sets')}
                        noItemTitle={gettext('No disabled sets configured')}
                        marginTop={true}
                        sets={this.state.sets?.disabled ?? []}
                        storageDestinations={this.props.storageDestinations}
                        onItemClicked={this.props.onItemClicked}
                        onEdit={this.props.onEdit}
                        currentSetId={this.props.currentSetId}
                    />
                </React.Fragment>
            );
        }
    };
}
