import * as React from 'react';
import {IconLabel, Input, Modal, Button, DatePickerISO, toasted} from 'superdesk-ui-framework/react';
import {CreateValidators, WithValidation} from '@superdesk/common';
import {fieldNotNull, stringNotEmpty} from '../../form-validation';
import {IRundownTemplate, IShow} from '../../interfaces';

import {superdesk} from '../../superdesk';

const {gettext} = superdesk.localization;
const {SelectFromEndpoint, Spacer, SpacerBlock, InputLabel} = superdesk.components;
const {httpRequestJsonLocal} = superdesk;

interface INewRundownData {
    showId: IShow['_id'] | null;
    template: IRundownTemplate | null;
    rundownName: string | null;
    airTime: string | null;
}

interface IProps {
    onClose(): void;
}

interface IState {
    loading: boolean;
    showId: IShow['_id'] | null;
    template: IRundownTemplate | null;
    rundownName: string | null;
    airTime: string | null;
}

const rundownValidators: CreateValidators<INewRundownData> = {
    showId: stringNotEmpty,
    template: fieldNotNull,
    rundownName: stringNotEmpty,
    airTime: stringNotEmpty,
};

export class CreateRundownFromTemplate extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            loading: false,
            showId: null,
            template: null,
            rundownName: null,
            airTime: new Date().toISOString().slice(0, 10),
        };
    }

    render() {
        const {showId, rundownName, template} = this.state;

        return (
            <WithValidation dynamic validators={rundownValidators}>
                {(validate, validationResults, refs) => {
                    const footerTemplate = (
                        <Spacer h gap="4" noGrow>
                            <Button
                                text={gettext('Cancel')}
                                onClick={() => {
                                    this.props.onClose();
                                }}
                                disabled={this.state.loading}
                            />
                            <Button
                                text={gettext('Create')}
                                onClick={() => {
                                    const valid: boolean = validate(this.state);

                                    if (this.state.template != null && valid) {
                                        httpRequestJsonLocal<IRundownTemplate>({
                                            method: 'POST',
                                            path: `/shows/${showId}/rundowns`,
                                            payload: {
                                                template: this.state.template._id,
                                                airtime_date: this.state.airTime,
                                            },
                                        }).then(() => {
                                            this.props.onClose();

                                            toasted.notify(
                                                gettext('Rundown created'),
                                                {type: 'success', duration: 2000},
                                            );
                                        });
                                    }
                                }}
                                type="primary"
                                disabled={this.state.loading}
                            />
                        </Spacer>
                    );

                    return (
                        <Modal
                            headerTemplate={gettext('Create rundown')}
                            size="medium"
                            onHide={this.props.onClose}
                            footerTemplate={footerTemplate}
                            visible
                        >
                            <Spacer v gap="16">
                                <SelectFromEndpoint
                                    label={gettext('Show')}
                                    endpoint="/shows"
                                    sort={[['name', 'asc']]}
                                    value={showId}
                                    onChange={(val) => {
                                        this.setState({showId: val, template: null, rundownName: null});
                                    }}
                                    itemTemplate={({item}: {item: IShow}) => (
                                        item == null
                                            ? (
                                                <span>{gettext('Select show')}</span>
                                            ) : (
                                                <span>{item.name}</span>
                                            )
                                    )}
                                    readOnly={this.state.loading}
                                    validationError={validationResults.showId}
                                    ref={refs.showId}
                                />

                                {
                                    showId != null && (
                                        <SelectFromEndpoint
                                            label={gettext('Template')}
                                            endpoint={`/shows/${showId}/templates`}
                                            sort={[['name', 'asc']]}
                                            value={template?._id ?? null}
                                            onChange={(templateId) => {
                                                this.setState({loading: true});

                                                httpRequestJsonLocal<IRundownTemplate>({
                                                    method: 'GET',
                                                    path: `/shows/${showId}/templates/${templateId}`,
                                                }).then((_template) => {
                                                    this.setState({
                                                        rundownName: _template.headline_template.prefix,
                                                        template: _template,
                                                        loading: false,
                                                    });
                                                });
                                            }}
                                            itemTemplate={({item}: {item: IShow}) => (
                                                item == null
                                                    ? (
                                                        <span>{gettext('Select template')}</span>
                                                    ) : (
                                                        <span>{item.name}</span>
                                                    )
                                            )}
                                            readOnly={this.state.loading}
                                            validationError={validationResults.template}
                                            ref={refs.template}
                                        />
                                    )
                                }

                                {
                                    rundownName != null && (
                                        <Input
                                            type="text"
                                            label={gettext('Rundown name')}
                                            value={rundownName}
                                            onChange={(val) => {
                                                this.setState({rundownName: val});
                                            }}
                                            disabled={this.state.loading}
                                            error={validationResults.rundownName ?? undefined}
                                            invalid={validationResults.rundownName != null}
                                            ref={refs.rundownName}
                                        />
                                    )
                                }

                                {
                                    template != null && (
                                        <DatePickerISO
                                            dateFormat={superdesk.instance.config.view.dateformat}
                                            label={gettext('Airtime')}
                                            value={this.state.airTime ?? ''}
                                            onChange={(val) => {
                                                this.setState({airTime: val});
                                            }}
                                            error={validationResults.airTime ?? undefined}
                                            invalid={validationResults.airTime != null}
                                            ref={refs.airTime}
                                        />
                                    )
                                }

                                {
                                    template != null && (
                                        <div>
                                            <InputLabel text={gettext('Template based settings')} />

                                            <SpacerBlock v gap="4" />

                                            <IconLabel
                                                type="default"
                                                text={template.planned_duration.toString()}
                                                innerLabel={gettext('Planned duration')}
                                                style="translucent"
                                            />

                                            <SpacerBlock h gap="4" />

                                            <IconLabel
                                                type="primary"
                                                text={template.airtime_time.toString()}
                                                innerLabel={gettext('Airtime')}
                                                style="translucent"
                                            />
                                        </div>
                                    )
                                }
                                <div />
                            </Spacer>
                        </Modal>
                    );
                }}
            </WithValidation>
        );
    }
}
