import * as React from 'react';
import {cloneDeep, isEqual, pickBy} from 'lodash';

import {ISuperdesk} from 'superdesk-api';
import {ISamsAPI, ISet, ISetItem, IStorageDestinationItem} from '../../interfaces';
import {SET_STATE} from '../../constants';

import {Button, ButtonGroup, Input, Option, Select, Switch} from 'superdesk-ui-framework/react';

import {
    FormGroup,
    FormRow,
    PanelContent,
    PanelContentBlock,
    PanelContentBlockInner,
    PanelHeader,
    PanelHeaderSlidingToolbar,
} from '../../ui';

interface IProps {
    set?: ISetItem;
    destinations?: Array<IStorageDestinationItem>;
    onDelete?(set: ISetItem): void;
    onClose(): void;
}

interface IState {
    diff: ISet;
    isDirty?: boolean;
    isExisting?: boolean;
}

export function getSetEditorPanel(superdesk: ISuperdesk, api: ISamsAPI) {
    const {gettext} = superdesk.localization;

    return class SetEditorPanel extends React.Component<IProps, IState> {
        constructor(props: IProps) {
            super(props);

            if (this.props.set?._id == null) {
                this.state = {
                    diff: {
                        destination_name: this.props.destinations?.[0]?._id,
                    },
                    isDirty: true,
                    isExisting: false,
                };
            } else {
                this.state = {
                    diff: cloneDeep<ISetItem>(this.props.set),
                    isDirty: false,
                    isExisting: true,
                };
            }

            this.onStateChange = this.onStateChange.bind(this);
            this.onSave = this.onSave.bind(this);
        }

        onChange = {
            name: (value: string) => this.onFieldChange('name', value),
            description: (value: string) => this.onFieldChange('description', value),
            destination_name: (value: string) => this.onFieldChange('destination_name', value),
        };

        onFieldChange(field: string, value: string): void {
            const dirtyFields = ['state', 'name', 'description', 'destination_name'];
            const diff = this.state.diff ?? {};
            let dirty = true;

            (diff as any)[field] = value;

            if (this.state.isExisting) {
                dirty = !isEqual(
                    pickBy(this.props.set, (_value, key: string) => dirtyFields.includes(key)),
                    pickBy(this.state.diff, (_value, key: string) => dirtyFields.includes(key)),
                );
            }

            this.setState({
                diff: diff,
                isDirty: dirty,
            });
        }

        onStateChange(value: boolean) {
            let newState: string;

            if (this.props.set?.state === SET_STATE.DRAFT) {
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
            const promise: Promise<ISetItem> = !this.state.isExisting ?
                api.sets.create(this.state.diff) :
                api.sets.update(this.props.set as ISetItem, this.state.diff);

            promise.then(() => {
                this.props.onClose();
            });
        }

        render() {
            const {destinations} = this.props;
            const {diff} = this.state;
            const saveButtonText = !this.state.isExisting ?
                gettext('Create') :
                gettext('Save');

            return (
                <React.Fragment>
                    <PanelHeader borderB={true}>
                        <PanelHeaderSlidingToolbar>
                            <ButtonGroup align="right">
                                <Button
                                    text={gettext('Cancel')}
                                    style="hollow"
                                    onClick={this.props.onClose}
                                />
                                <Button
                                    text={saveButtonText}
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
                                {!this.state.isExisting ? null : (
                                    <FormGroup>
                                        <FormRow>
                                            <label>{gettext('Enabled')}</label>
                                            <Switch
                                                value={diff.state === SET_STATE.USABLE}
                                                onChange={this.onStateChange}
                                            />
                                        </FormRow>
                                    </FormGroup>
                                )}
                                <FormGroup>
                                    <FormRow>
                                        <Input
                                            label={gettext('Name')}
                                            value={diff?.name}
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
                                            value={diff?.description}
                                            onChange={this.onChange.description}
                                            disabled={false}
                                        />
                                    </FormRow>
                                </FormGroup>
                                <FormGroup>
                                    <FormRow>
                                        <Select
                                            label={gettext('Destination')}
                                            value={diff?.destination_name}
                                            required={true}
                                            onChange={this.onChange.destination_name}
                                            disabled={false}
                                        >
                                            {(destinations ?? []).map((destination) => (
                                                <Option key={destination._id} value={destination._id}>
                                                    {destination._id} / {destination.provider}
                                                </Option>
                                            ))}
                                        </Select>
                                    </FormRow>
                                </FormGroup>
                            </PanelContentBlockInner>
                        </PanelContentBlock>
                    </PanelContent>
                </React.Fragment>
            );
        }
    };
}
