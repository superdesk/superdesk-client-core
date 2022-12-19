// External Modules
import * as React from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';

// Types
import {ASSET_TYPE_FILTER, IAssetSearchParams, LIST_ACTION} from '../../interfaces';
import {IApplicationState} from '../../store';
import {superdeskApi} from '../../apis';

// Redux Actions & Selectors
import {updateAssetSearchParamsAndListItems} from '../../store/assets/actions';
import {getAssetSearchParams} from '../../store/assets/selectors';

// UI
import {RadioButtonGroup} from 'superdesk-ui-framework/react';

interface IProps {
    searchParams: IAssetSearchParams;
    updateAssetSearchParamsAndListItems(params: Partial<IAssetSearchParams>): void;
}

const mapStateToProps = (state: IApplicationState) => ({
    searchParams: getAssetSearchParams(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    updateAssetSearchParamsAndListItems: (params: Partial<IAssetSearchParams>) => dispatch<any>(
        updateAssetSearchParamsAndListItems(
            params,
            LIST_ACTION.REPLACE,
        ),
    ),
});

export class AssetTypeFilterButtonsComponent extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.changeFilter = this.changeFilter.bind(this);
    }

    changeFilter(typeFilter: ASSET_TYPE_FILTER) {
        this.props.updateAssetSearchParamsAndListItems({mimetypes: typeFilter});
    }

    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <RadioButtonGroup
                value={this.props.searchParams.mimetypes}
                onChange={this.changeFilter}
                options={[
                    {value: ASSET_TYPE_FILTER.ALL, label: gettext('All item types')},
                    {value: ASSET_TYPE_FILTER.IMAGES, label: gettext('Images only')},
                    {value: ASSET_TYPE_FILTER.VIDEOS, label: gettext('Videos only')},
                    {value: ASSET_TYPE_FILTER.AUDIO, label: gettext('Audio only')},
                    {value: ASSET_TYPE_FILTER.DOCUMENTS, label: gettext('Documents only')},
                ]}
            />
        );
    }
}

export const AssetTypeFilterButtons = connect(
    mapStateToProps,
    mapDispatchToProps,
)(AssetTypeFilterButtonsComponent);
