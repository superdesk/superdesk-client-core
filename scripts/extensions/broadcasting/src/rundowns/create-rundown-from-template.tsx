import * as React from 'react';
import {IconLabel, Input, Modal, Button, DatePickerISO, toasted} from 'superdesk-ui-framework/react';
import {CreateValidators, WithValidation} from '@superdesk/common';
import {fieldNotNull, stringNotEmpty} from '../form-validation';
import {IRundownTemplate, IShow} from '../interfaces';

import {superdesk} from '../superdesk';
import {PlannedDurationLabel} from './components/planned-duration-label';
import {SelectShow} from './components/select-show';
import {IRestApiResponse} from 'superdesk-api';

const {gettext} = superdesk.localization;
const {SelectFromEndpoint, Spacer, SpacerBlock, InputLabel} = superdesk.components;
const {httpRequestJsonLocal} = superdesk;

interface INewRundownData {
    showId: IShow['_id'] | null;
    template: IRundownTemplate | null;
    rundownTitle: string | null;
    airTime: string | null;
}

interface IProps {
    onClose(): void;
}

interface IState {
    loading: boolean;
    showId: IShow['_id'] | null;
    template: IRundownTemplate | null;
    rundownTitle: string | null;
    airTime: string | null;
}

const rundownValidators: CreateValidators<INewRundownData> = {
    showId: stringNotEmpty,
    template: fieldNotNull,
    rundownTitle: stringNotEmpty,
    airTime: stringNotEmpty,
};

export class CreateRundownFromTemplate extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            loading: false,
            showId: null,
            template: null,
            rundownTitle: null,
            airTime: new Date().toISOString().slice(0, 10),
        };
    }

    render() {
        const {showId, rundownTitle, template} = this.state;

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
                                            path: '/rundowns',
                                            payload: {
                                                show: showId,
                                                template: this.state.template._id,
                                                airtime_date: this.state.airTime,
                                                title: this.state.rundownTitle,
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
                            zIndex={1051}
                        >
                            <Spacer v gap="16">
                                <SelectShow
                                    value={showId}
                                    onChange={(val) => {
                                        httpRequestJsonLocal<IRestApiResponse<IRundownTemplate>>({
                                            method: 'GET',
                                            path: `/shows/${val}/templates`,
                                        }).then(({_items}) => {
                                            const _template: IRundownTemplate | null =
                                                _items.length === 1 ? _items[0] : null;

                                            this.setState({
                                                showId: val,
                                                template: _template,
                                                rundownTitle: _template == null ? '' : _template.title_template.prefix,
                                            });
                                        });
                                    }}
                                    required={true}
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
                                                        template: _template,
                                                        rundownTitle: _template.title_template.prefix,
                                                        loading: false,
                                                    });
                                                });
                                            }}
                                            itemTemplate={({entity: rundownTemplate}: {entity: IRundownTemplate}) => (
                                                rundownTemplate == null
                                                    ? (
                                                        <span>{gettext('Select template')}</span>
                                                    ) : (
                                                        <span>{rundownTemplate.title}</span>
                                                    )
                                            )}
                                            readOnly={this.state.loading}
                                            validationError={validationResults.template}
                                            ref={refs.template}
                                            required={true}
                                        />
                                    )
                                }

                                {
                                    template != null && (
                                        <Input
                                            type="text"
                                            label={gettext('Rundown name')}
                                            value={rundownTitle ?? ''}
                                            onChange={(val) => {
                                                this.setState({rundownTitle: val});
                                            }}
                                            disabled={this.state.loading}
                                            error={validationResults.rundownTitle ?? undefined}
                                            invalid={validationResults.rundownTitle != null}
                                            ref={refs.rundownTitle}
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

                                            <PlannedDurationLabel planned_duration={template.planned_duration} />

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
