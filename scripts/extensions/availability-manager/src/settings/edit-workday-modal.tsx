import * as React from 'react';
import {IBaseRestApiResponse} from 'superdesk-api';
import {
    Button,
    Modal,
    RadioButtonGroup,
    Spacer,
    SpacerBlock,
} from 'superdesk-ui-framework/react';
import {availabilityStatuses} from '../constants';
import {IAvailabilityRecord, IWorkingHours} from '../interfaces';
import {superdesk} from '../superdesk';
import {getLabelForStatus, getLocalizedDateString} from '../utils';
import {EditWorkingHours} from './edit-working-hours';

const {gettext, locale} = superdesk.localization;
const {httpRequestJsonLocal} = superdesk;
const {generatePatch} = superdesk.utilities;
const {assertNever} = superdesk.helpers;

interface IProps {
    workingDay:
        {kind: 'saved'; value: IAvailabilityRecord}
        | {kind: 'draft'; template: Omit<IAvailabilityRecord, keyof IBaseRestApiResponse>};

    /**
     * item is returned so parent component can conditionally show preview after closing
     */
    onClose(item: IAvailabilityRecord | null): void;
}

interface IState {
    workingDay: IAvailabilityRecord;
    loading: boolean;
}

export class EditWorkdayModal extends React.PureComponent<IProps, IState> {
    private _mounted: boolean;

    constructor(props: IProps) {
        super(props);

        this.state = {
            workingDay: (() => {
                if (this.props.workingDay.kind === 'saved') {
                    return this.props.workingDay.value;
                } else if (this.props.workingDay.kind === 'draft') {
                    return this.props.workingDay.template as IAvailabilityRecord;
                } else {
                    return assertNever(this.props.workingDay);
                }
            })(),
            loading: false,
        };

        this.updateWorkingHours = this.updateWorkingHours.bind(this);

        this._mounted = false;
    }

    private updateWorkingHours(index: number, next: IWorkingHours) {
        this.setState({
            workingDay: {
                ...this.state.workingDay,
                working_hours: (this.state.workingDay.working_hours ?? []).map((current, i) => index === i ? next : current),
            },
        });
    }

    componentDidMount(): void {
        this._mounted = true;
    }

    componentWillUnmount(): void {
        this._mounted = false;
    }

    handleClose(item?: IAvailabilityRecord) {
        const itemFallback = (() => {
            if (this.props.workingDay.kind === 'draft') {
                return null;
            } else if (this.props.workingDay.kind === 'saved') {
                return this.props.workingDay.value;
            } else {
                return assertNever(this.props.workingDay);
            }
        })() satisfies IAvailabilityRecord | null;

        this.props.onClose(item ?? itemFallback);
    }

    render() {
        const {workingDay} = this.state;

        return (
            <Modal
                visible
                headerTemplate={gettext('Edit availability')}
                footerTemplate={(
                    <Spacer h gap="8" justifyContent="end" noWrap>
                        <Button
                            text={gettext('Cancel')}
                            onClick={() => this.handleClose()}
                            noMargin
                            disabled={this.state.loading}
                        />

                        <Button
                            text={gettext('Save')}
                            type="primary"
                            onClick={() => {
                                this.setState({loading: true});

                                const workingDayNext: IAvailabilityRecord = workingDay.status === 'partial'
                                    ? workingDay
                                    : {...workingDay, working_hours: []};

                                const savePromise = (() => {
                                    if (this.props.workingDay.kind === 'saved') {
                                        return httpRequestJsonLocal<IAvailabilityRecord>({
                                            method: 'PATCH',
                                            path: `/user_availability/${workingDay._id}`,
                                            payload: generatePatch(this.props.workingDay.value, workingDayNext),
                                            headers: {
                                                'If-Match': workingDay._etag,
                                            },
                                        });
                                    } else if (this.props.workingDay.kind === 'draft') {
                                        return httpRequestJsonLocal<IAvailabilityRecord>({
                                            method: 'POST',
                                            path: `/user_availability`,
                                            payload: workingDayNext,
                                        });
                                    } else {
                                        return assertNever(this.props.workingDay);
                                    }
                                })();

                                savePromise.then((res) => {
                                    this.handleClose(res);
                                }).finally(() => {
                                    if (this._mounted) {
                                        this.setState({loading: false});
                                    }
                                });
                            }}
                            disabled={this.state.loading}
                            isLoading={this.state.loading}
                            noMargin
                        />
                    </Spacer>
                )}
                onHide={() => this.handleClose()}
            >
                <h4>
                    {getLocalizedDateString(locale.code, new Date(workingDay.date))}
                </h4>

                <SpacerBlock v gap="16" />

                <RadioButtonGroup
                    value={workingDay.status}
                    options={availabilityStatuses.map((status) => ({
                        value: status,
                        label: getLabelForStatus(status),
                    }))}
                    onChange={(nextStatus) => {
                        this.setState({
                            workingDay: {
                                ...workingDay,
                                status: nextStatus as IAvailabilityRecord['status'],
                            }
                        });
                    }}
                    disabled={this.state.loading}
                />

                <SpacerBlock v gap="16" />

                {
                    workingDay.status === 'partial' && (
                        <EditWorkingHours
                            value={workingDay.working_hours ?? []}
                            onChange={(nextValue) => {
                                this.setState({
                                    workingDay: {
                                        ...this.state.workingDay,
                                        working_hours: nextValue,
                                    },
                                });
                            }}
                            disabled={this.state.loading}
                        />
                    )
                }
            </Modal>
        );
    }
}
