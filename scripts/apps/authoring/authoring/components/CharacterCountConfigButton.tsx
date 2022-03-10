/* eslint-disable react/no-multi-comp */
import React from 'react';
import {showModal} from 'core/services/modalService';
import {Modal} from 'core/ui/components/Modal/Modal';
import {ModalHeader} from 'core/ui/components/Modal/ModalHeader';
import {gettext} from 'core/utils';
import {ModalBody} from 'core/ui/components/Modal/ModalBody';
import {ModalFooter} from 'core/ui/components/Modal/ModalFooter';
import {RadioGroup, CheckGroup} from 'superdesk-ui-framework/react';
import ng from 'core/services/ng';
import {dispatchInternalEvent} from 'core/internal-events';
import {AUTHORING_FIELD_PREFERENCES} from 'core/constants';

export type CharacterLimitUiBehavior = 'highlight' | 'limit'; // highlight extra chars or limit the editor
export interface ICharacterLimitUiBehavior {
    [schemaField: string]: CharacterLimitUiBehavior;
}

export const DEFAULT_UI_FOR_EDITOR_LIMIT: CharacterLimitUiBehavior = 'highlight';

interface IProps {
    field: string;
}

interface IState {
    preferences: any;
}

export class CharacterCountConfigButton extends React.Component<
    IProps,
    IState
> {
    preferencesService: any;

    constructor(props) {
        super(props);

        this.state = {
            preferences: null,
        };

        this.preferencesService = ng.get('preferencesService');
        this.onModalValueChange = this.onModalValueChange.bind(this);
    }

    componentDidMount() {
        this.preferencesService.get().then((preferences) => {
            this.setState({
                preferences,
            });
        });
    }

    onModalValueChange(newValue: CharacterLimitUiBehavior) {
        if (!newValue) {
            return;
        }

        const newPreferences = {
            ...this.state.preferences,
            [AUTHORING_FIELD_PREFERENCES]: {
                ...this.state.preferences[AUTHORING_FIELD_PREFERENCES],
                [this.props.field]: {
                    characterLimitMode: newValue,
                },
            },
        };

        this.setState({preferences: newPreferences});
        this.preferencesService.update(newPreferences);
        dispatchInternalEvent('changeUserPreferences', newPreferences);
    }

    render() {
        if (this.state.preferences == null) {
            return null;
        }

        const fieldPrefs = this.state.preferences[AUTHORING_FIELD_PREFERENCES];

        return (
            <button
                className="char-count-config-button"
                onClick={() => {
                    showModal((props) => (
                        <CharacterCountConfigModal
                            closeModal={props.closeModal}
                            value={fieldPrefs?.[this.props.field].characterLimitMode ?? DEFAULT_UI_FOR_EDITOR_LIMIT}
                            onChange={this.onModalValueChange}
                        />
                    ));
                }}
            >
                <i className="icon-settings" />
            </button>
        );
    }
}

interface IModalProps {
    closeModal(): void;
    onChange(newValue: CharacterLimitUiBehavior): void;
    value: CharacterLimitUiBehavior;
}

interface IModalState {
    radioValue: CharacterLimitUiBehavior;
}

export class CharacterCountConfigModal extends React.PureComponent<IModalProps, IModalState> {
    constructor(props) {
        super(props);

        this.state = {
            radioValue: props.value,
        };

        this.onRadioValueChange = this.onRadioValueChange.bind(this);
    }

    onRadioValueChange(radioValue: CharacterLimitUiBehavior) {
        this.setState({radioValue});
    }

    render() {
        return (
            <Modal>
                <ModalHeader>{gettext('Character limit settings')}</ModalHeader>
                <ModalBody>
                    <p>
                        {gettext(
                            'You can either completely block further writing after the character' +
                            'limit is reached or highlight exceeding characters in red.',
                        )}
                    </p>
                    <CheckGroup orientation="vertical">
                        <RadioGroup
                            value={this.state.radioValue}
                            options={[
                                {
                                    value: 'highlight',
                                    label: gettext('Highlight characters'),
                                },
                                {
                                    value: 'limit',
                                    label: gettext('Limit further typing'),
                                },
                            ]}
                            onChange={this.onRadioValueChange}
                        />
                    </CheckGroup>
                </ModalBody>
                <ModalFooter>
                    <button
                        className="btn btn--primary pull-right"
                        onClick={() => {
                            this.props.onChange(this.state.radioValue);
                            this.props.closeModal();
                        }}
                        disabled={false}
                    >
                        {gettext('Save')}
                    </button>
                    <button className="btn pull-right" onClick={this.props.closeModal}>
                        {gettext('Cancel')}
                    </button>
                </ModalFooter>
            </Modal>
        );
    }
}
