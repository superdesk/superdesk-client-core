// External Modules
import * as React from 'react';
import {connect} from 'react-redux';
import {cloneDeep} from 'lodash';

// Types
import {Dispatch} from 'redux';
import {ISuperdesk} from 'superdesk-api';
import {ISetItem, IStorageDestinationItem, SET_STATE, IApplicationState} from '../../interfaces';

// Redux Actions & Selectors
import {createSet, updateSet} from '../../store/sets/actions';
import {setsBranch} from '../../store/sets/branch';
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
    currentDestination?: IStorageDestinationItem;
    dispatch: Dispatch;
}

const mapStateToProps = (state: IApplicationState) => ({
    original: getSelectedSet(state),
    destinations: getStorageDestinations(state),
    currentDestination: getSelectedSetStorageDestination(state),
});

interface IState {
    updates: Partial<ISetItem>;
    isDirty?: boolean;
}

export function getSetEditorPanel(superdesk: ISuperdesk) {
    const {gettext} = superdesk.localization;

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
            this.onCancel = this.onCancel.bind(this);

            this.onChange = {
                name: (value: string) => this.onFieldChange('name', value),
                description: (value: string) => this.onFieldChange('description', value),
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
            if (this.props.original != null) {
                this.props.dispatch<any>(updateSet(this.props.original, this.state.updates));
            } else {
                this.props.dispatch<any>(createSet(this.state.updates));
            }
        }

        onCancel() {
            if (this.props.original != null) {
                this.props.dispatch(setsBranch.previewSet.action(this.props.original._id));
            } else {
                this.props.dispatch(setsBranch.closeContentPanel.action());
            }
        }

        render() {
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
                                />
                                <Button
                                    text={this.props.original != null ?
                                        gettext('Save') :
                                        gettext('Create')
                                    }
                                    type="primary"
                                    disabled={!this.state.isDirty}
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

    return connect(mapStateToProps)(SetEditorPanelComponent);
}
