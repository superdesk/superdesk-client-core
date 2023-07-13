import * as React from 'react';
import {Input, DurationInput} from 'superdesk-ui-framework/react';
import {CreateValidators, WithValidation} from '@superdesk/common';
import {stringNotEmpty} from '../form-validation';
import {superdesk} from '../superdesk';
import {IShow, IShowBase} from '../interfaces';

const {gettext} = superdesk.localization;
const {Spacer} = superdesk.components;
const {generatePatch} = superdesk.utilities;
const {httpRequestJsonLocal} = superdesk;

function isShow(x: IShow | Partial<IShowBase>): x is IShow {
    return (x as unknown as any)['_id'] != null;
}

interface IProps<T extends IShow | Partial<IShowBase>> {
    show: T;
    readOnly?: boolean;
    children: (form: JSX.Element, save: () => Promise<IShow>) => JSX.Element;
}

interface IState {
    showUpdated: Partial<IShowBase>;
    inProgress: boolean;
}

const showValidators: CreateValidators<Partial<IShowBase>> = {
    title: stringNotEmpty,
};

export class WithShow<T extends IShow | Partial<IShowBase>> extends React.PureComponent<IProps<T>, IState> {
    constructor(props: IProps<T>) {
        super(props);

        this.state = {
            showUpdated: {...props.show},
            inProgress: false,
        };

        this.updateShowProperty = this.updateShowProperty.bind(this);
        this.doSave = this.doSave.bind(this);
    }

    private updateShowProperty(update: Partial<IShow>) {
        this.setState({
            ...this.state,
            showUpdated: {
                ...this.state.showUpdated,
                ...update,
            },
        });
    }

    private doSave(): Promise<IShow> {
        this.setState({inProgress: true});

        if (isShow(this.props.show)) {
            return httpRequestJsonLocal<IShow>({
                method: 'PATCH',
                path: `/shows/${this.props.show._id}`,
                payload: generatePatch(this.props.show, this.state.showUpdated, {undefinedEqNull: true}),
                headers: {
                    'If-Match': this.props.show._etag,
                },
            });
        } else {
            return httpRequestJsonLocal<IShow>({
                method: 'POST',
                path: '/shows',
                payload: this.state.showUpdated,
            });
        }
    }

    render() {
        const show = this.state.showUpdated;

        return (
            <WithValidation validators={showValidators}>
                {(validate, validationResults) => {
                    const handleSave = () => {
                        const valid = validate(show);

                        if (valid) {
                            return this.doSave();
                        } else {
                            return Promise.reject();
                        }
                    };

                    const form = (
                        <Spacer v gap="16">
                            <Input
                                label={gettext('Show name')}
                                type="text"
                                value={show.title ?? ''}
                                error={validationResults.title ?? undefined}
                                required={true}
                                onChange={(val) => {
                                    this.updateShowProperty({title: val});
                                }}
                                disabled={this.props.readOnly}
                            />

                            <Input
                                label={gettext('Description')}
                                type="text"
                                value={show.description ?? ''}
                                error={validationResults.description ?? undefined}
                                required={false}
                                onChange={(val) => {
                                    this.updateShowProperty({description: val});
                                }}
                                disabled={this.props.readOnly}
                            />

                            <DurationInput
                                label={gettext('Planned duration')}
                                seconds={show.planned_duration ?? 3600}
                                onChange={(val) => {
                                    this.updateShowProperty({planned_duration: val});
                                }}
                                error={validationResults.planned_duration ?? undefined}
                                invalid={validationResults.planned_duration != null}
                                disabled={this.props.readOnly}
                            />
                        </Spacer>
                    );

                    return this.props.children(form, handleSave);
                }}
            </WithValidation>
        );
    }
}
