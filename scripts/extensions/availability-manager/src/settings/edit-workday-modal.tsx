import * as React from 'react';
import {range} from 'lodash';
import {IBaseRestApiResponse} from 'superdesk-api';
import {
    Button,
    Modal,
    RadioButtonGroup,
    Spacer,
} from 'superdesk-ui-framework/react';
import {availabilityStatuses} from '../constants';
import {IAvailabilityRecord, ITagsWhiteList, IWorkingHours} from '../interfaces';
import {superdesk} from '../superdesk';
import {getLabelForStatus, getLocalizedDateString, validateWorkingHours} from '../utils';
import {WithWorkingHoursEditor} from './edit-working-hours';
import {ValidationErrors} from '../validation-errors';

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

    tagsWhitelist: ITagsWhiteList;
}

interface IState {
    workingDay: IAvailabilityRecord;
    savingInProgress: boolean;
    validationError: string | null;
}

export class EditWorkdayModal extends React.PureComponent<IProps, IState> {
    private _mounted: boolean;
    private errorsElementRef: React.RefObject<HTMLDivElement>;

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
            savingInProgress: false,
            validationError: null,
        };

        this.updateWorkingHours = this.updateWorkingHours.bind(this);

        this._mounted = false;
        this.errorsElementRef = React.createRef<HTMLDivElement>();
    }

    private updateWorkingHours(index: number, next: IWorkingHours) {
        this.setState({
            workingDay: {
                ...this.state.workingDay,
                working_hours:
                    (this.state.workingDay.working_hours ?? []).map((current, i) => index === i ? next : current),
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
                            disabled={this.state.savingInProgress}
                        />

                        <Button
                            text={gettext('Save')}
                            type="primary"
                            onClick={() => {
                                const validationError = validateWorkingHours(
                                    this.state.workingDay.working_hours ?? [],
                                    locale.code,
                                );

                                if (validationError != null) {
                                    this.setState({validationError}, () => {
                                        this.errorsElementRef.current?.scrollIntoView();
                                    });

                                    return;
                                }

                                this.setState({savingInProgress: true});

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
                                            path: '/user_availability',
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
                                        this.setState({savingInProgress: false});
                                    }
                                });
                            }}
                            disabled={this.state.savingInProgress}
                            isLoading={this.state.savingInProgress}
                            noMargin
                        />
                    </Spacer>
                )}
                onHide={() => this.handleClose()}
            >
                <Spacer v gap="16" noWrap>
                    <h4>
                        {getLocalizedDateString(locale.code, new Date(workingDay.date))}
                    </h4>

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
                                },
                            });
                        }}
                        disabled={this.state.savingInProgress}
                    />

                    {
                        workingDay.status === 'partial' && (
                            <WithWorkingHoursEditor
                                value={workingDay.working_hours ?? []}
                                onChange={(nextValue) => {
                                    this.setState({
                                        validationError: null,
                                        workingDay: {
                                            ...this.state.workingDay,
                                            working_hours: nextValue,
                                        },
                                    });
                                }}
                                disabled={this.state.savingInProgress}
                                tagsWhitelist={this.props.tagsWhitelist}
                            >
                                {({inputs, labels}) => {
                                    const columnCount = labels.length;

                                    return (
                                        <div
                                            style={{
                                                display: 'grid',
                                                gap: '8px',
                                                gridTemplateColumns: range(0, columnCount).map(() => 'auto').join(' '),
                                            }}
                                        >
                                            {
                                                labels.map((label, i) => (
                                                    <React.Fragment key={i}>
                                                        {label}
                                                    </React.Fragment>
                                                ))
                                            }
                                            {
                                                inputs.map((row, i) => (
                                                    <React.Fragment key={i}>
                                                        {...row}
                                                    </React.Fragment>
                                                ))
                                            }
                                        </div>
                                    );
                                }}
                            </WithWorkingHoursEditor>
                        )
                    }

                    {
                        this.state.validationError != null && (
                            <ValidationErrors scrollRef={this.errorsElementRef}>
                                {this.state.validationError}
                            </ValidationErrors>
                        )
                    }
                </Spacer>
            </Modal>
        );
    }
}
