// External Modules
import * as React from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import {cloneDeep} from 'lodash';

// Types
import {ISuperdesk} from 'superdesk-api';
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
    isDirty?: boolean;
}

export function getSetEditorPanel(superdesk: ISuperdesk) {
    const {gettext} = superdesk.localization;

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
                };
            } else {
                this.state = {
                    updates: cloneDeep<ISetItem>(this.props.original),
                    isDirty: false,
                };
            }

            this.onStateChange = this.onStateChange.bind(this);
            this.onSave = this.onSave.bind(this);
            this.onCreate = this.onCreate.bind(this);
            this.previewSet = this.previewSet.bind(this);

            this.onChange = {
                name: (value: string) => this.onFieldChange('name', value),
                description: (value: string) => this.onFieldChange('description', value),
                destination_name: (value: string) => this.onFieldChange('destination_name', value),
                state: (value: boolean) => this.onStateChange(value),
            };
        }

        onFieldChange(field: string, value: string): void {
            const updates = this.state.updates;
            let dirty = true;

            (updates as any)[field] = value;

            if (this.props.original != null) {
                dirty = hasItemChanged<ISetItem>(this.props.original, this.state.updates);
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
            this.props.updateSet(this.props.original as ISetItem, this.state.updates);
        }

        onCreate() {
            this.props.createSet(this.state.updates);
        }

        previewSet() {
            if (this.props.original != null) {
                this.props.previewSet(this.props.original);
            }
        }

        renderHeaderButtons() {
            return (this.props.original != null) ? (
                <ButtonGroup align="right">
                    <Button
                        text={gettext('Cancel')}
                        style="hollow"
                        onClick={this.previewSet}
                    />
                    <Button
                        text={gettext('Save')}
                        type="primary"
                        disabled={!this.state.isDirty}
                        onClick={this.onSave}
                    />
                </ButtonGroup>
            ) : (
                <ButtonGroup align="right">
                    <Button
                        text={gettext('Cancel')}
                        style="hollow"
                        onClick={this.props.closeEditor}
                    />
                    <Button
                        text={gettext('Create')}
                        type="primary"
                        onClick={this.onCreate}
                    />
                </ButtonGroup>
            );
        }

        render() {
            const {currentDestination} = this.props;
            const destinations = this.props.destinations ?? [];
            const {updates} = this.state;

            return (
                <React.Fragment>
                    <PanelHeader borderB={true}>
                        <PanelHeaderSlidingToolbar>
                            {this.renderHeaderButtons()}
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
                                        <FormLabel text={gettext('Storage Destination')} style="light"/>
                                        <Text>{currentDestination?._id}</Text>

                                        <FormLabel text={gettext('Storage Provider')} style="light"/>
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

    return connect(
        mapStateToProps,
        mapDispatchToProps,
    )(SetEditorPanelComponent);
}
