// External Modules
import * as React from 'react';
import {connect} from 'react-redux';

// Types
import {Dispatch} from 'redux';
import {ISuperdesk} from 'superdesk-api';
import {ISetItem, IStorageDestinationItem, IApplicationState} from '../../interfaces';

// Redux Actions & Selectors
import {confirmBeforeDeletingSet} from '../../store/sets/actions';
import {setsBranch} from '../../store/sets/branch';
import {getSetsGroupedByState, getSelectedSetId} from '../../store/sets/selectors';
import {getStorageDestinationsById} from '../../store/storageDestinations/selectors';

// UI
import {SetListGroup} from './setListGroup';

interface IProps {
    storageDestinations: Dictionary<string, IStorageDestinationItem>;
    currentSetId?: string;
    sets: ISetArrays;
    dispatch: Dispatch;
}

const mapStateToProps = (state: IApplicationState) => ({
    sets: getSetsGroupedByState(state),
    storageDestinations: getStorageDestinationsById(state),
    currentSetId: getSelectedSetId(state),
});

type ISetArrays = {
    draft: Array<ISetItem>;
    usable: Array<ISetItem>;
    disabled: Array<ISetItem>;
};

export function getSetListPanel(superdesk: ISuperdesk) {
    const {gettext} = superdesk.localization;

    class SetListPanelComponent extends React.PureComponent<IProps> {
        constructor(props: IProps) {
            super(props);

            this.editSet = this.editSet.bind(this);
            this.previewSet = this.previewSet.bind(this);
            this.deleteSet = this.deleteSet.bind(this);
        }

        editSet(set: ISetItem) {
            this.props.dispatch(setsBranch.editSet.action(set._id));
        }

        previewSet(set: ISetItem) {
            this.props.dispatch(setsBranch.previewSet.action(set._id));
        }

        deleteSet(set: ISetItem) {
            this.props.dispatch<any>(confirmBeforeDeletingSet(set));
        }

        render() {
            if (Object.keys(this.props.storageDestinations).length === 0) {
                return null;
            }

            return (
                <React.Fragment>
                    <SetListGroup
                        title={gettext('Draft Sets')}
                        noItemTitle={gettext('No draft sets configured')}
                        sets={this.props.sets.draft ?? []}
                        storageDestinations={this.props.storageDestinations}
                        previewSet={this.previewSet}
                        deleteSet={this.deleteSet}
                        editSet={this.editSet}
                        currentSetId={this.props.currentSetId}
                    />
                    <SetListGroup
                        title={gettext('Usable Sets')}
                        noItemTitle={gettext('No usable sets configured')}
                        marginTop={true}
                        sets={this.props.sets.usable ?? []}
                        storageDestinations={this.props.storageDestinations}
                        previewSet={this.previewSet}
                        editSet={this.editSet}
                        currentSetId={this.props.currentSetId}
                    />
                    <SetListGroup
                        title={gettext('Disabled Sets')}
                        noItemTitle={gettext('No disabled sets configured')}
                        marginTop={true}
                        sets={this.props.sets.disabled ?? []}
                        storageDestinations={this.props.storageDestinations}
                        previewSet={this.previewSet}
                        editSet={this.editSet}
                        currentSetId={this.props.currentSetId}
                    />
                </React.Fragment>
            );
        }
    }

    return connect(mapStateToProps)(SetListPanelComponent);
}
