// External Modules
import * as React from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import {cloneDeep} from 'lodash';

// Types
import {ISetItem, IStorageDestinationItem, SET_STATE} from '../../interfaces';
import {IApplicationState} from '../../store';

// Redux Actions & Selectors
import {createSet, previewSet, updateSet, closeSetContentPanel} from '../../store/sets/actions';
import {getSelectedSet, getSelectedSetStorageDestination} from '../../store/sets/selectors';
import {getStorageDestinations} from '../../store/storageDestinations/selectors';

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

// Utils
import {hasItemChanged} from '../../utils/api';
import {superdeskApi} from '../../apis';

interface IProps {
    original?: ISetItem;
    destinations: Array<IStorageDestinationItem>;
    closeEditor(): void;
    previewSet(set: ISetItem): void;
    updateSet(original: ISetItem, updates: Partial<ISetItem>): Promise<ISetItem>;
    createSet(set: Partial<ISetItem>): Promise<ISetItem>;
    currentDestination?: IStorageDestinationItem;
}

interface IState {
    updates: Partial<ISetItem>;
    isDirty: boolean;
    submitting: boolean;
}

const mapStateToProps = (state: IApplicationState) => ({
    original: getSelectedSet(state),
    destinations: getStorageDestinations(state),
    currentDestination: getSelectedSetStorageDestination(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    closeEditor: () => dispatch(closeSetContentPanel()),
    previewSet: (set: ISetItem) => dispatch(previewSet(set._id)),
    updateSet: (original: ISetItem, updates: ISetItem) => dispatch<any>(updateSet(original, updates)),
    createSet: (set: ISetItem) => dispatch<any>(createSet(set)),
});

class SetEditorPanelComponent extends React.Component<IProps, IState> {
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
            };
        } else {
            this.state = {
                updates: cloneDeep<ISetItem>(this.props.original),
                isDirty: false,
                submitting: false,
            };
        }

        this.onStateChange = this.onStateChange.bind(this);
        this.onSave = this.onSave.bind(this);
        this.onCancel = this.onCancel.bind(this);

        this.onChange = {
            name: (value: string) => this.onFieldChange('name', value.trim()),
            description: (value: string) => this.onFieldChange('description', value.trim()),
            destination_name: (value: string) => this.onFieldChange('destination_name', value),
            state: (value: boolean) => this.onStateChange(value),
        };
    }

    onFieldChange(field: keyof ISetItem, value: any): void {
        const updates = this.state.updates;
        let dirty = true;

        updates[field] = value;

        if (this.props.original != null) {
            dirty = hasItemChanged(this.props.original, this.state.updates);
        }

        this.setState({
            updates: updates,
            isDirty: dirty,
        });
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

    onSave() {
        this.setState({submitting: true});

        const promise = this.props.original != null ?
            this.props.updateSet(this.props.original, this.state.updates) :
            this.props.createSet(this.state.updates);

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
                        <ButtonGroup align="right">
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
                    <PanelContentBlock>
                        <PanelContentBlockInner grow={true}>
                            {this.props.original == null ? null : (
                                <FormGroup>
                                    <FormRow>
                                        <label>{gettext('Enabled')}</label>
                                        <Switch
                                            value={updates.state === SET_STATE.USABLE}
                                            onChange={this.onChange.state}
                                        />
                                    </FormRow>
                                </FormGroup>
                            )}
                            <FormGroup>
                                <FormRow>
                                    <Input
                                        label={gettext('Name')}
                                        value={updates.name}
                                        required={true}
                                        onChange={this.onChange.name}
                                        disabled={false}
                                    />
                                </FormRow>
                            </FormGroup>
                            <FormGroup>
                                <FormRow>
                                    <Input
                                        label={gettext('Description')}
                                        value={updates.description}
                                        onChange={this.onChange.description}
                                        disabled={false}
                                    />
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
