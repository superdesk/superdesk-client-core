// External Modules
import * as React from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';

// Types
import {ISuperdesk} from 'superdesk-api';
import {ISetItem, IStorageDestinationItem} from '../../interfaces';
import {IApplicationState} from '../../store';

// Redux Actions & Selectors
import {confirmBeforeDeletingSet, editSet, previewSet} from '../../store/sets/actions';
import {getSetsGroupedByState, getSelectedSetId} from '../../store/sets/selectors';
import {getStorageDestinationsById} from '../../store/storageDestinations/selectors';

// UI
import {SetListGroup} from './setListGroup';

interface IProps {
    storageDestinations: Dictionary<string, IStorageDestinationItem>;

    previewSet(set: ISetItem): void;
    deleteSet(set: ISetItem): void;
    editSet(set: ISetItem): void;

    currentSetId?: string;
    sets: ISetArrays;
}

type ISetArrays = {
    draft: Array<ISetItem>;
    usable: Array<ISetItem>;
    disabled: Array<ISetItem>;
};

export function getSetListPanel(superdesk: ISuperdesk) {
    const {gettext} = superdesk.localization;

    const mapStateToProps = (state: IApplicationState) => ({
        sets: getSetsGroupedByState(state),
        storageDestinations: getStorageDestinationsById(state),
        currentSetId: getSelectedSetId(state),
    });

    const mapDispatchToProps = (dispatch: Dispatch) => ({
        editSet: (set: ISetItem) => dispatch(editSet(set._id)),
        previewSet: (set: ISetItem) => dispatch(previewSet(set._id)),
        deleteSet: (set: ISetItem) => dispatch<any>(confirmBeforeDeletingSet(set)),
    });

    class SetListPanelComponent extends React.PureComponent<IProps> {
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
                        previewSet={this.props.previewSet}
                        deleteSet={this.props.deleteSet}
                        editSet={this.props.editSet}
                        currentSetId={this.props.currentSetId}
                    />
                    <SetListGroup
                        title={gettext('Usable Sets')}
                        noItemTitle={gettext('No usable sets configured')}
                        marginTop={true}
                        sets={this.props.sets.usable ?? []}
                        storageDestinations={this.props.storageDestinations}
                        previewSet={this.props.previewSet}
                        editSet={this.props.editSet}
                        currentSetId={this.props.currentSetId}
                    />
                    <SetListGroup
                        title={gettext('Disabled Sets')}
                        noItemTitle={gettext('No disabled sets configured')}
                        marginTop={true}
                        sets={this.props.sets.disabled ?? []}
                        storageDestinations={this.props.storageDestinations}
                        previewSet={this.props.previewSet}
                        editSet={this.props.editSet}
                        currentSetId={this.props.currentSetId}
                    />
                </React.Fragment>
            );
        }
    }

    return connect(
        mapStateToProps,
        mapDispatchToProps,
    )(SetListPanelComponent);
}
