// External modules
import * as React from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import {cloneDeep} from 'lodash';

// Types
import {ASSET_STATE, IAssetItem, ISetItem} from '../../interfaces';
import {IApplicationState} from '../../store';
import {superdeskApi} from '../../apis';

// Redux Actions & Selectors
import {previewAsset, updateAsset} from '../../store/assets/actions';
import {getSelectedAsset} from '../../store/assets/selectors';
import {getActiveSets} from '../../store/sets/selectors';

// UI
import {Button, ButtonGroup, FormLabel, Input, Option, Select} from 'superdesk-ui-framework/react';
import {
    FormGroup,
    FormRow,
    PanelHeader,
    PanelHeaderSlidingToolbar,
} from '../../ui';
import {getHumanReadableFileSize} from '../../utils/ui';

// Utils
import {hasItemChanged} from '../../utils/api';

interface IProps {
    original?: IAssetItem;
    disabled?: boolean;
    previewAsset(asset: IAssetItem): void;
    onChange(field: string, value: string): void;
    updateAsset(original: IAssetItem, updates: Partial<IAssetItem>): Promise<IAssetItem>;
    sets?: Array<ISetItem>;
    fields?: Array<keyof IAssetItem>;
}

interface IState {
    updates: Partial<IAssetItem>;
    isDirty: boolean;
    submitting: boolean;
}

const mapStateToProps = (state: IApplicationState) => ({
    original: getSelectedAsset(state),
    sets: getActiveSets(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    previewAsset: (asset: IAssetItem) => dispatch(previewAsset(asset._id)),
    updateAsset: (original: IAssetItem, updates: IAssetItem) => dispatch<any>(updateAsset(original, updates)),
});

export class AssetEditorPanelComponent extends React.PureComponent<IProps, IState> {
    onChange: Dictionary<string, (value: any) => void>;

    constructor(props: IProps) {
        super(props);

        if (this.props.original?._id == null) {
            this.state = {
                updates: {
                },
                isDirty: true,
                submitting: false,
            };
        } else {
            this.state = {
                updates: cloneDeep<IAssetItem>(this.props.original),
                isDirty: false,
                submitting: false,
            };
        }

        this.onFieldChange = this.onFieldChange.bind(this);
        this.onSave = this.onSave.bind(this);
        this.onCancel = this.onCancel.bind(this);

        this.onChange = {
            name: (value: string) => this.onFieldChange('name', value.trim()),
            description: (value: string) => this.onFieldChange('description', value.trim()),
            state: (value: string) => this.onFieldChange('state', value),
            set_id: (value: string) => this.onFieldChange('set_id', value),
        };
    }

    onFieldChange(field: keyof IAssetItem, value: any): void {
        const updates = this.state.updates;

        let dirty = true;

        (updates[field] as any) = value;

        if (this.props.original != null) {
            dirty = hasItemChanged(this.props.original, this.state.updates);
        }

        this.setState({
            updates: updates,
            isDirty: dirty,
        });
    }

    onSave() {
        this.setState({submitting: true});

        if (this.props.original != null) {
            const promise = this.props.updateAsset(this.props.original!, this.state.updates);

            promise
                .then((asset: IAssetItem) => {
                    // If the submission was completed successfully
                    // then close the editor and open the preview
                    this.props.previewAsset(asset);
                })
                .catch(() => {
                    // If there was an error submitting the request
                    // then re-enable the 'SAVE'|'CREATE' button
                    this.setState({submitting: false});
                });
        }
    }

    onCancel() {
        if (this.props.original != null) {
            this.props.previewAsset(this.props.original);
        }
    }

    fieldEnabled(field: keyof IAssetItem) {
        return (this.props.fields == null || this.props.fields.includes(field)) ?
            true :
            null;
    }

    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <React.Fragment>
                <PanelHeader borderB={true}>
                    <PanelHeaderSlidingToolbar>
                        <ButtonGroup align="right">
                            <Button
                                text={gettext('Cancel')}
                                style="hollow"
                                onClick={this.onCancel}
                                disabled={this.state.submitting}
                            />
                            <Button
                                text={gettext('Save')}
                                type="primary"
                                disabled={!this.state.isDirty || this.state.submitting}
                                onClick={this.onSave}
                            />
                        </ButtonGroup>
                    </PanelHeaderSlidingToolbar>
                </PanelHeader>
                <FormGroup>
                    <FormRow>
                        <FormLabel text={gettext('Filename:')} />
                        <span>{this.props.original?.filename}</span>
                    </FormRow>
                </FormGroup>
                <FormGroup>
                    <FormRow>
                        <FormLabel text={gettext('Type:')} />
                        <span>{this.props.original?.mimetype}</span>
                    </FormRow>
                    <FormRow>
                        <FormLabel text={gettext('Size:')} />
                        <span>
                            {this.props.original?.length && getHumanReadableFileSize(this.props.original?.length)}
                        </span>
                    </FormRow>
                </FormGroup>
                {this.fieldEnabled('name') && (
                    <FormGroup>
                        <FormRow>
                            <Input
                                label={gettext('Name')}
                                value={this.props.original?.name}
                                onChange={this.onChange.name}
                                disabled={this.props.disabled === true}
                            />
                        </FormRow>
                    </FormGroup>
                )}
                {this.fieldEnabled('description') && (
                    <FormGroup>
                        <FormRow>
                            <Input
                                label={gettext('Description')}
                                value={this.props.original?.description}
                                onChange={this.onChange.description}
                                disabled={this.props.disabled === true}
                            />
                        </FormRow>
                    </FormGroup>
                )}
                {this.fieldEnabled('state') && (
                    <FormGroup>
                        <FormRow>
                            <Select
                                label={gettext('State')}
                                value={this.props.original?.state}
                                required={true}
                                onChange={this.onChange.state}
                                disabled={this.props.disabled === true}
                            >
                                <Option value={ASSET_STATE.DRAFT}>
                                    {gettext('Draft')}
                                </Option>
                                <Option value={ASSET_STATE.INTERNAL}>
                                    {gettext('Internal')}
                                </Option>
                                <Option value={ASSET_STATE.PUBLIC}>
                                    {gettext('Public')}
                                </Option>
                            </Select>
                        </FormRow>
                    </FormGroup>
                )}
                {this.fieldEnabled('set_id') && (
                    <FormGroup>
                        <FormRow>
                            <Select
                                label={gettext('Set')}
                                value={this.props.original?.set_id}
                                required={true}
                                onChange={this.onChange.set_id}
                                disabled={this.props.disabled === true}
                            >
                                {this.props.sets?.map((set) => (
                                    <Option key={set._id} value={set._id}>
                                        {set.name}
                                    </Option>
                                ))}
                            </Select>
                        </FormRow>
                    </FormGroup>
                )}
            </React.Fragment>
        );
    }
}

export const AssetEditorPanel = connect(
    mapStateToProps,
    mapDispatchToProps,
)(AssetEditorPanelComponent);
