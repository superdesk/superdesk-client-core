// External Modules
import * as React from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import {cloneDeep, isEqual} from 'lodash';

// Types
import {IDesk} from 'superdesk-api';
import {ISetItem, IStorageDestinationItem, SET_STATE, DATA_UNIT} from '../../interfaces';
import {IApplicationState} from '../../store';
import {superdeskApi, samsApi} from '../../apis';

// Redux Actions & Selectors
import {previewSet, closeSetContentPanel} from '../../store/sets/actions';
import {getSelectedSet, getSelectedSetStorageDestination} from '../../store/sets/selectors';
import {getStorageDestinations} from '../../store/storageDestinations/selectors';
import {getDesksAllowedSets} from '../../store/workspace/selectors';

// UI
import {Button, ButtonGroup, Input, Option, Select, Switch, FormLabel} from 'superdesk-ui-framework/react';
import {
    FormGroup,
    FormRow,
    PanelContent,
    PanelContentBlock,
    PanelContentBlockInner,
    PanelHeader,
    PanelHeaderSlidingToolbar,
    Text,
} from '../../ui';
import {getFileSizeFromHumanReadable} from '../../utils/ui';
import {VersionUserDateLines} from '../common/versionUserDateLines';
import {DesksSelectInput} from '../common/DesksSelectInput';

// Utils
import {hasItemChanged} from '../../utils/api';

interface IProps {
    original?: ISetItem;
    destinations: Array<IStorageDestinationItem>;
    currentDestination?: IStorageDestinationItem;
    allowedDesksForSet: Dictionary<ISetItem['_id'], Array<IDesk['_id']>>;
    closeEditor(): void;
    previewSet(set: ISetItem): void;
}

interface IState {
    updates: Partial<ISetItem>;
    isDirty: boolean;
    submitting: boolean;
    storage_unit: DATA_UNIT;
    desks: Array<IDesk['_id']>;
}

const mapStateToProps = (state: IApplicationState) => ({
    original: getSelectedSet(state),
    destinations: getStorageDestinations(state),
    currentDestination: getSelectedSetStorageDestination(state),
    allowedDesksForSet: getDesksAllowedSets(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    closeEditor: () => dispatch(closeSetContentPanel()),
    previewSet: (set: ISetItem) => dispatch(previewSet(set._id)),
});

export class SetEditorPanelComponent extends React.Component<IProps, IState> {
    onChange: Dictionary<string, (value: any) => void>;

    constructor(props: IProps) {
        super(props);

        if (this.props.original?._id == null) {
            this.state = {
                updates: {
                    destination_name: this.props.destinations?.[0]?._id,
                },
                isDirty: true,
                submitting: false,
                storage_unit: DATA_UNIT.BYTES,
                desks: [],
            };
        } else {
            this.state = {
                updates: cloneDeep<ISetItem>(this.props.original),
                isDirty: false,
                submitting: false,
                storage_unit: DATA_UNIT.BYTES,
                desks: this.props.allowedDesksForSet[this.props.original._id] ?? [],
            };
        }

        this.onStateChange = this.onStateChange.bind(this);
        this.onSave = this.onSave.bind(this);
        this.onCancel = this.onCancel.bind(this);
        this.updateStorageUnit = this.updateStorageUnit.bind(this);
        this.onMaxAssetSizeChange = this.onMaxAssetSizeChange.bind(this);

        this.onChange = {
            name: (value: string) => this.onFieldChange('name', value.trim()),
            description: (value: string) => this.onFieldChange('description', value.trim()),
            destination_name: (value: string) => this.onFieldChange('destination_name', value),
            maximum_asset_size: (value: number) => this.onMaxAssetSizeChange(value, this.state.storage_unit),
            storage_unit: (value: DATA_UNIT) => this.updateStorageUnit(value),
            state: (value: boolean) => this.onStateChange(value),
            desks: (value: Array<IDesk['_id']>) => this.onDesksChange(value),
        };
    }

    hasDeskRestrictionsChanged() {
        if (this.props.original?._id == null) {
            return false;
        }

        const original = this.props.allowedDesksForSet[this.props.original._id] ?? [];
        const updates = this.state.desks;

        return isEqual(original.sort(), updates.sort());
    }

    isFormDirty(newState: IState) {
        let dirty = true;

        if (this.props.original != null) {
            dirty = hasItemChanged(this.props.original, newState.updates);

            const original = this.props.allowedDesksForSet[this.props.original._id];
            const updates = newState.desks;

            if (isEqual(original.sort(), updates.sort())) {
                dirty = false;
            }
        }

        return dirty;
    }

    onFieldChange(field: keyof ISetItem, value: any): void {
        const updates = this.state.updates;
        let dirty = true;

        (updates[field] as any) = value;

        if (this.props.original != null) {
            dirty = hasItemChanged(this.props.original, updates);
        }

        if (this.hasDeskRestrictionsChanged()) {
            dirty = true;
        }

        this.setState({
            updates: updates,
            isDirty: dirty,
        });
    }

    onMaxAssetSizeChange(assetSize: number, unit: DATA_UNIT) {
        let newFileSize: number;

        newFileSize = getFileSizeFromHumanReadable(assetSize, unit);
        this.onFieldChange('maximum_asset_size', newFileSize);
    }

    updateStorageUnit(value: DATA_UNIT) {
        this.setState({
            storage_unit: value,
        });
        this.onMaxAssetSizeChange(this.state.updates.maximum_asset_size || 0, value);
    }

    onStateChange(value: boolean) {
        let newState: string;

        if (this.props.original?.state === SET_STATE.DRAFT) {
            newState = value === true ?
                SET_STATE.USABLE :
                SET_STATE.DRAFT;
        } else {
            newState = value === true ?
                SET_STATE.USABLE :
                SET_STATE.DISABLED;
        }

        this.onFieldChange('state', newState);
    }

    onDesksChange(deskIds: Array<IDesk['_id']>) {
        this.setState((prevState: IState) => ({
            desks: deskIds,
            isDirty: this.hasDeskRestrictionsChanged() ?
                true :
                prevState.isDirty,
        }));
    }

    onSave() {
        this.setState({submitting: true});

        const promise = this.props.original != null ?
            samsApi.sets.update(this.props.original, this.state.updates, this.state.desks) :
            samsApi.sets.create(this.state.updates, this.state.desks);

        promise
            .then((set: ISetItem) => {
                // If the submission was completed successfully
                // then close the editor and open the preview
                this.props.previewSet(set);
            })
            .catch(() => {
                // If there was an error submitting the request
                // then re-enable the 'SAVE'|'CREATE' button
                this.setState({submitting: false});
            });
    }

    onCancel() {
        if (this.props.original != null) {
            this.props.previewSet(this.props.original);
        } else {
            this.props.closeEditor();
        }
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {currentDestination} = this.props;
        const destinations = this.props.destinations ?? [];
        const {updates} = this.state;

        return (
            <React.Fragment>
                <PanelHeader borderB={true}>
                    <PanelHeaderSlidingToolbar>
                        <ButtonGroup align="end">
                            <Button
                                text={gettext('Cancel')}
                                style="hollow"
                                onClick={this.onCancel}
                                disabled={this.state.submitting}
                            />
                            <Button
                                text={this.props.original != null ?
                                    gettext('Save') :
                                    gettext('Create')
                                }
                                type="primary"
                                disabled={!this.state.isDirty || this.state.submitting}
                                onClick={this.onSave}
                            />
                        </ButtonGroup>
                    </PanelHeaderSlidingToolbar>
                </PanelHeader>
                <PanelContent>
                    {this.props.original == null ? null : (
                        <PanelContentBlock flex={true}>
                            <PanelContentBlockInner grow={true}>
                                <VersionUserDateLines item={this.props.original} />
                            </PanelContentBlockInner>
                        </PanelContentBlock>
                    )}
                    <PanelContentBlock>
                        <PanelContentBlockInner grow={true}>
                            {this.props.original == null ? null : (
                                <FormGroup>
                                    <FormRow>
                                        <Switch
                                            label={{text: gettext('Enabled'), side: 'left'}}
                                            value={updates.state === SET_STATE.USABLE}
                                            onChange={this.onChange.state}
                                        />
                                    </FormRow>
                                </FormGroup>
                            )}
                            <FormGroup>
                                <FormRow>
                                    <Input
                                        type="text"
                                        label={gettext('Name')}
                                        value={updates.name ?? ''}
                                        required={true}
                                        onChange={this.onChange.name}
                                        disabled={false}
                                    />
                                </FormRow>
                            </FormGroup>
                            <FormGroup>
                                <FormRow>
                                    <Input
                                        type="text"
                                        label={gettext('Description')}
                                        value={updates.description ?? ''}
                                        onChange={this.onChange.description}
                                        disabled={false}
                                    />
                                </FormRow>
                            </FormGroup>
                            <FormGroup>
                                <FormRow>
                                    <Input
                                        label={gettext('Maximum Asset Size')}
                                        type="number"
                                        value={updates.maximum_asset_size || 0}
                                        info={gettext('value of 0 will disable this restriction')}
                                        onChange={this.onChange.maximum_asset_size}
                                        disabled={false}
                                    />
                                </FormRow>
                                <FormRow>
                                    <Select
                                        label={gettext('Storage Unit')}
                                        onChange={this.onChange.storage_unit}
                                    >
                                        <Option value={DATA_UNIT.BYTES}>{gettext('Bytes')}</Option>
                                        <Option value={DATA_UNIT.KB}>{gettext('KB')}</Option>
                                        <Option value={DATA_UNIT.MB}>{gettext('MB')}</Option>
                                        <Option value={DATA_UNIT.GB}>{gettext('GB')}</Option>
                                    </Select>
                                </FormRow>
                            </FormGroup>
                            {(this.props.original == null || updates.state === SET_STATE.DRAFT) ? (
                                <FormGroup>
                                    <FormRow>
                                        <Select
                                            label={gettext('Destination')}
                                            value={updates.destination_name}
                                            required={true}
                                            onChange={this.onChange.destination_name}
                                            disabled={false}
                                        >
                                            {destinations.map((destination) => (
                                                <Option key={destination._id} value={destination._id}>
                                                    {destination._id} / {destination.provider}
                                                </Option>
                                            ))}
                                        </Select>
                                    </FormRow>
                                </FormGroup>
                            ) : (
                                <React.Fragment>
                                    <FormLabel
                                        text={gettext('Storage Destination')}
                                        style="light"
                                    />
                                    <Text>{currentDestination?._id}</Text>

                                    <FormLabel
                                        text={gettext('Storage Provider')}
                                        style="light"
                                    />
                                    <Text>{currentDestination?.provider}</Text>
                                </React.Fragment>
                            )}
                            <DesksSelectInput
                                label={gettext('Allowed Desks')}
                                value={this.props.original?._id != null ?
                                    this.props.allowedDesksForSet[this.props.original._id] ?? [] :
                                    []
                                }
                                onChange={this.onChange.desks}
                            />
                        </PanelContentBlockInner>
                    </PanelContentBlock>
                </PanelContent>
            </React.Fragment>
        );
    }
}

export const SetEditorPanel = connect(
    mapStateToProps,
    mapDispatchToProps,
)(SetEditorPanelComponent);
