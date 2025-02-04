// External Modules
import * as React from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';

// Types
import {ISetItem, IStorageDestinationItem} from '../../interfaces';
import {IApplicationState} from '../../store';
import {superdeskApi} from '../../apis';

// Redux Actions & Selectors
import {confirmBeforeDeletingSet, editSet, previewSet} from '../../store/sets/actions';
import {getSetsGroupedByState, getSelectedSetId, getAssetsCountForSets} from '../../store/sets/selectors';
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
    counts: Dictionary<string, number>;
}

type ISetArrays = {
    draft: Array<ISetItem>;
    usable: Array<ISetItem>;
    disabled: Array<ISetItem>;
};

const mapStateToProps = (state: IApplicationState) => ({
    sets: getSetsGroupedByState(state),
    storageDestinations: getStorageDestinationsById(state),
    currentSetId: getSelectedSetId(state),
    counts: getAssetsCountForSets(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    editSet: (set: ISetItem) => dispatch(editSet(set._id)),
    previewSet: (set: ISetItem) => dispatch(previewSet(set._id)),
    deleteSet: (set: ISetItem) => dispatch<any>(confirmBeforeDeletingSet(set)),
});

export class SetListPanelComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        if (Object.keys(this.props.storageDestinations).length === 0) {
            return null;
        }

        return (
            <React.Fragment>
                <SetListGroup
                    title={gettext('Draft Sets')}
                    noItemTitle={gettext('No draft sets configured')}
                    sets={this.props.sets.draft ?? []}
                    counts={this.props.counts}
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
                    counts={this.props.counts}
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
                    counts={this.props.counts}
                    storageDestinations={this.props.storageDestinations}
                    previewSet={this.props.previewSet}
                    deleteSet={this.props.deleteSet}
                    editSet={this.props.editSet}
                    currentSetId={this.props.currentSetId}
                />
            </React.Fragment>
        );
    }
}

export const SetListPanel = connect(
    mapStateToProps,
    mapDispatchToProps,
)(SetListPanelComponent);
