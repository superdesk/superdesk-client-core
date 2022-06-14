import * as React from 'react';
import {Input, Button, Spinner} from 'superdesk-ui-framework/react';
import {CreateValidators, IValidationResult, numberValidator, stringValidator} from './form-validation';
import {IShow, IShowBase} from './interfaces';

import {superdesk} from './superdesk';

const {gettext} = superdesk.localization;
const {Spacer} = superdesk.components;
const {httpRequestJsonLocal} = superdesk;

const {
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
} = superdesk.components;

interface IProps {
    closeModal(): void;
}

interface IState {
    show: IShowBase;
    validationResults?: {[key: string]: IValidationResult}; // key = keyof IShow
    inProgress: boolean;
}

const showValidators: CreateValidators<IShowBase> = {
    name: stringValidator,
    description: stringValidator,
    duration: (val) => {
        const result = numberValidator(val);

        if (result.valid !== true) {
            return result;
        } else {
            if (val < 1) {
                return {valid: false, errors: ['value must be greater than zero']};
            } else {
                return {valid: true};
            }
        }
    },
};

const showBaseProperties = Object.keys(showValidators) as Array<keyof IShowBase>;

function getValidationMessage(
    field: keyof IShowBase,
    validationResults: IState['validationResults'],
): string | undefined {
    const resultForField = validationResults?.[field];

    if (resultForField == null) {
        return undefined;
    } else if (resultForField.valid !== true) {
        if (resultForField.errors.length > 0) {
            return resultForField?.errors[0];
        } else {
            return undefined;
        }
    } else {
        return undefined;
    }
}

export class CreateShowModal extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            show: {
                name: '',
                description: '',
                duration: 3600,
            },
            inProgress: false,
        };

        this.updateShowProperty = this.updateShowProperty.bind(this);
        this.cancel = this.cancel.bind(this);
        this.handleSave = this.handleSave.bind(this);
    }

    private updateShowProperty(update: Partial<IShow>) {
        this.setState({
            ...this.state,
            show: {
                ...this.state.show,
                ...update,
            },
        });
    }

    private cancel() {
        this.props.closeModal();
    }

    private handleSave() {
        const validationResults: IState['validationResults'] = {};

        for (const property of showBaseProperties) {
            const validator = showValidators[property] as unknown as (value: unknown) => IValidationResult;

            validationResults[property] = validator(this.state.show[property]);
        }

        const allValid = Object.values(validationResults).every((item) => item.valid === true);

        if (allValid) {
            this.setState({validationResults: {}, inProgress: true});

            httpRequestJsonLocal({
                method: 'POST',
                path: '/rundown_shows', // TODO: update endpoint name
                payload: this.state.show,
            }).then(() => {
                this.setState({inProgress: false}, () => {
                    this.props.closeModal(); // TODO: initiate rundown template creation
                });
            });

        } else {
            this.setState({validationResults: validationResults});
        }
    }

    render() {
        const {show, validationResults} = this.state;

        return (
            <Modal>
                <ModalHeader onClose={this.props.closeModal}>
                    {gettext('Create new show')}
                </ModalHeader>

                <ModalBody>
                    <Spacer v gap="16">
                        <Input
                            label={gettext('Show name')}
                            type="text"
                            value={show.name}
                            error={getValidationMessage('name', validationResults)}
                            invalid={getValidationMessage('name', validationResults) != null}
                            required={true}
                            onChange={(val) => {
                                this.updateShowProperty({name: val});
                            }}
                        />

                        <Input
                            label={gettext('Description')}
                            type="text"
                            value={show.description}
                            error={getValidationMessage('description', validationResults)}
                            invalid={getValidationMessage('description', validationResults) != null}
                            required={true}
                            onChange={(val) => {
                                this.updateShowProperty({description: val});
                            }}
                        />

                        <Input
                            label={gettext('Planned duration')}
                            type="number"
                            value={show.duration ?? ''} // TODO: remove default together with parseInt
                            error={getValidationMessage('duration', validationResults)}
                            invalid={getValidationMessage('duration', validationResults) != null}
                            required={true}
                            onChange={(val) => {
                                // TODO: remove parseInt
                                if (val.length > 0) {
                                    this.updateShowProperty({duration: parseInt(val, 10)});
                                } else {
                                    this.updateShowProperty({duration: undefined});
                                }
                            }}
                        />
                    </Spacer>
                </ModalBody>

                <ModalFooter flex>
                    <Spacer h gap="32" justifyContent="space-between" noWrap>
                        <div>
                            {
                                this.state.inProgress && (
                                    <Spinner />
                                )
                            }
                        </div>

                        <div>
                            <Spacer h gap="8" noWrap>
                                <Button
                                    text={gettext('Cancel')}
                                    onClick={this.cancel}
                                    disabled={this.state.inProgress}
                                />
                                <Button
                                    text={gettext('Save')}
                                    onClick={this.handleSave}
                                    type="primary"
                                    disabled={this.state.inProgress}
                                />
                            </Spacer>
                        </div>
                    </Spacer>
                </ModalFooter>
            </Modal>
        );
    }
}
