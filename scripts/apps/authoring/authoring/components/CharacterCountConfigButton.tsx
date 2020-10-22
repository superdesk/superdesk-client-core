/* eslint-disable react/no-multi-comp */
import React from 'react';
import {showModal} from 'core/services/modalService';
import {Modal} from 'core/ui/components/Modal/Modal';
import {ModalHeader} from 'core/ui/components/Modal/ModalHeader';
import {gettext} from 'core/utils';
import {ModalBody} from 'core/ui/components/Modal/ModalBody';
import {ModalFooter} from 'core/ui/components/Modal/ModalFooter';
import {Radio, CheckGroup} from 'superdesk-ui-framework';
import {onChange} from 'core/editor3/store';
import ng from 'core/services/ng';

export const CHARACTER_COUNT_UI_PREF = 'editor:char_count_ui';

export interface ICharaterCountUiPref {
    [schemaField: string]: 'highlight' | 'limit'; // highlight extra chars or limit the editor
}

const DEFAULT_UI: valueof<ICharaterCountUiPref> = 'highlight';

interface IProps {
    field: string
}

interface IState {
    uiPref: ICharaterCountUiPref
}

export class CharacterCountConfigButton extends React.Component<IProps, IState> {
    preferencesService: any

    constructor(props) {
        super(props);

        this.state = {
            uiPref: null,
        };

        this.preferencesService = ng.get('preferencesService');
        this.onModalValueChange = this.onModalValueChange.bind(this);
    }

    componentDidMount() {
        this.preferencesService.get().then((preferences) => {
            if (CHARACTER_COUNT_UI_PREF in preferences) {
                this.setState({
                    uiPref: preferences[CHARACTER_COUNT_UI_PREF][this.props.field] ?? DEFAULT_UI,
                });
            }
        });
    }

    onModalValueChange(newValue: ICharaterCountUiPref) {
        this.setState({uiPref: newValue});
        this.preferencesService.update({
            [CHARACTER_COUNT_UI_PREF]: {
                [this.props.field]: newValue,
            },
        });
    }

    render() {
        if (this.state.uiPref == null) {
            return null;
        }

        return (
            <button
                className="char-count-config-button"
                onClick={() => {
                    showModal((props) => (
                        <CharacterCountConfigModal
                            closeModal={props.closeModal}
                            value={this.state.uiPref}
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

function CharacterCountConfigModal({closeModal, onChange, value}) {
    const [radioValue, radioValueSet] = React.useState<ICharaterCountUiPref>(value);

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
                    <Radio
                        value={radioValue}
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
                        onChange={radioValueSet}
                    />
                </CheckGroup>
            </ModalBody>
            <ModalFooter>
                <button
                    className="btn btn--primary pull-right"
                    onClick={() => {
                        onChange(radioValue);
                        closeModal();
                    }}
                    disabled={false}
                >
                    {gettext('Save')}
                </button>
                <button className="btn pull-right" onClick={closeModal}>
                    {gettext('Cancel')}
                </button>
            </ModalFooter>
        </Modal>
    );
}
