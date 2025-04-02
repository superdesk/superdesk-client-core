import * as React from 'react';
import {getWeekdayNames, Spacer} from '@sourcefabric/common';
import {keyBy, range} from 'lodash';
import {Alert, Button, CheckboxButton, CheckButtonGroup, Label, Modal, TreeSelect} from 'superdesk-ui-framework/react';
import {availabilityStatuses, dayCodes, dayIndexesByDayCode, IDayIndex} from '../constants';
import {getLabelForStatus, getStylesForStatusDot, validateSchedule} from '../utils';
import {IDefaultAvailability, IScheduleRecord} from '../interfaces';
import {superdesk} from '../superdesk';
import {WithWorkingHoursEditor} from './edit-working-hours';
import {IBaseRestApiResponse} from 'superdesk-api';

const {locale} = superdesk.localization;
const {gettext} = superdesk.localization;
const {httpRequestJsonLocal} = superdesk;
const {omitBaseApiResponse} = superdesk.utilities;

const placeholder: IScheduleRecord = {
    status: 'available',
    working_hours: [],
};

const workingHoursEditorColumnCount = 3;
const additionalColumnCount = 2;

/**
 * To use CSS grid, the number of columns need to be known in advance.
 * Since we reuse {@link WithWorkingHoursEditor} for every week day, it's difficult to work out
 * the number of columns dynamically.
 */
const columnCount = workingHoursEditorColumnCount + additionalColumnCount;

interface IProps {
    onClose(): void;
}

interface IState {
    schedule: {[weekDayIndex: string]: IScheduleRecord};
    validationErrors: {[weekDayIndex: string]: string};
    defaultAvailabilityRecord: IDefaultAvailability | null;
}

export class ManageScheduleModal extends React.PureComponent<IProps, IState> {
    private errorsElementRef: React.RefObject<HTMLDivElement>;

    constructor(props: IProps) {
        super(props);

        this.state = {
            schedule: {},
            defaultAvailabilityRecord: null,
            validationErrors: {},
        };

        this.handleScheduleItemChange = this.handleScheduleItemChange.bind(this);
        this.handleRemoveScheduleItem = this.handleRemoveScheduleItem.bind(this);
        this.save = this.save.bind(this);

        this.errorsElementRef = React.createRef<HTMLDivElement>();
    }

    private handleScheduleItemChange(index: number, patch: Partial<IScheduleRecord>) {
        const update = {
            ...this.state.schedule[index],
            ...patch,
        };

        // drop working hours if status changes to something else than partial
        if (update.status !== 'partial') {
            update.working_hours = [];
        }

        this.setState({
            schedule: {
                ...this.state.schedule,
                [index]: update,
            },
            validationErrors: {},
        });
    }

    private handleRemoveScheduleItem(index: number) {
        const nextSchedule = {...this.state.schedule};

        delete nextSchedule[index];

        this.setState({
            schedule: nextSchedule,
            validationErrors: {},
        });
    }

    private save() {
        const errors = validateSchedule(this.state.schedule, locale.code);

        if (Object.keys(errors).length > 0) {
            this.setState(
                {validationErrors: errors},
                () => {
                    this.errorsElementRef.current?.scrollIntoView();
                },
            );
        } else {
            httpRequestJsonLocal({
                method: 'PUT',
                path: `/default_user_availability/${superdesk.session.getCurrentUserId()}`,
                payload: {
                    ...(
                        this.state.defaultAvailabilityRecord == null
                            ? {}
                            : omitBaseApiResponse(this.state.defaultAvailabilityRecord)
                    ),
                    working_days:
                        Object.entries(this.state.schedule)
                            .reduce((acc: IDefaultAvailability['working_days'], [index, value]) => {
                                acc[dayCodes[index as IDayIndex]] = value;

                                return acc;
                            }, {} as IDefaultAvailability['working_days']),
                    language: [],
                } satisfies Omit<IDefaultAvailability, keyof IBaseRestApiResponse>,
                headers: this.state.defaultAvailabilityRecord == null ? {} : {
                    'If-Match': this.state.defaultAvailabilityRecord._etag,
                },
            }).then(() => {
                this.props.onClose();
            });
        }
    }

    componentDidMount(): void {
        httpRequestJsonLocal<IDefaultAvailability>({
            method: 'GET',
            path: `/default_user_availability/${superdesk.session.getCurrentUserId()}`,
        }).then((res) => {
            this.setState({
                schedule: Object.entries(res.working_days).reduce((acc: IState['schedule'], [dayCode, value]) => {
                    acc[dayIndexesByDayCode[dayCode]] = value;

                    return acc;
                }, {}),
                defaultAvailabilityRecord: res,
            });
        });
    }

    render() {
        const weekdays = getWeekdayNames(locale.firstDayOfWeek, locale.code);
        const weekdaysKeyed = keyBy(weekdays, (weekday) => weekday.index);
        const enabledWeekdays = weekdays.filter(({index}) => this.state.schedule[index] != null);
        const renderLabels = enabledWeekdays.some(
            (weekday) => this.state.schedule[weekday.index]?.status === 'partial',
        );

        // PR-TODO: implement when connected to HTTP endpoint
        const loading = false;

        return (
            <Modal
                visible
                headerTemplate={gettext('Default schedule')}
                onHide={this.props.onClose}
                footerTemplate={(
                    <Spacer h gap="8" justifyContent="end" noWrap>
                        <Button
                            text={gettext('Cancel')}
                            onClick={() => this.props.onClose()}
                            noMargin
                            disabled={loading}
                        />

                        <Button
                            text={gettext('Save')}
                            type="primary"
                            onClick={() => {
                                this.save();
                            }}
                            disabled={loading}
                            isLoading={loading}
                            noMargin
                        />
                    </Spacer>
                )}
            >
                <Spacer v gap="16" noWrap>
                    <CheckButtonGroup>
                        {
                            weekdays.map((weekday) => (
                                <CheckboxButton
                                    key={weekday.index}
                                    checked={this.state.schedule[weekday.index] != null}
                                    label={{text: weekday.nameShort}}
                                    onChange={() => {
                                        if (this.state.schedule[weekday.index] == null) {
                                            this.handleScheduleItemChange(weekday.index, placeholder);
                                        } else {
                                            this.handleRemoveScheduleItem(weekday.index);
                                        }
                                    }}
                                    disabled={loading}
                                />
                            ))
                        }
                    </CheckButtonGroup>

                    {
                        enabledWeekdays.length > 0 && (
                            <div
                                style={{
                                    display: 'grid',
                                    gap: '8px',
                                    gridTemplateColumns: range(0, columnCount).map(() => 'min-content').join(' '),
                                }}
                            >
                                {
                                    enabledWeekdays
                                        .filter(({index}) => this.state.schedule[index] != null)
                                        .map((weekday, enabledWeekdayIndex) => {
                                            const scheduleRecord = this.state.schedule[weekday.index];

                                            const getExtraColumns = (rowIndex: number) => {
                                                const extraColumns = [
                                                    (
                                                        <div
                                                            style={{display: 'flex', alignItems: 'center'}}
                                                            key="name"
                                                        >
                                                            <strong>{weekday.nameLong}</strong>
                                                        </div>
                                                    ),
                                                    (
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',

                                                                // PR-TODO: drop after fix in ui-framework
                                                                minWidth: 200,
                                                            }}
                                                            key="status"
                                                        >
                                                            <TreeSelect
                                                                kind="synchronous"
                                                                value={
                                                                    [
                                                                        scheduleRecord.status,
                                                                    ] as typeof availabilityStatuses
                                                                }
                                                                getOptions={
                                                                    () => availabilityStatuses
                                                                        .map((id) => ({value: id}))
                                                                }
                                                                getId={(id) => id}
                                                                getLabel={(id) => getLabelForStatus(id)}
                                                                onChange={([val]) => {
                                                                    this.handleScheduleItemChange(
                                                                        weekday.index,
                                                                        {status: val},
                                                                    );
                                                                }}
                                                                optionTemplate={(id) => (
                                                                    <Spacer h gap="4" justifyContent="start" noWrap>
                                                                        <div>
                                                                            <div
                                                                                style={{
                                                                                    ...getStylesForStatusDot(id),
                                                                                }}
                                                                            />
                                                                        </div>

                                                                        <div>{getLabelForStatus(id)}</div>
                                                                    </Spacer>
                                                                )}
                                                                valueTemplate={(id, Wrapper) => (
                                                                    <Wrapper>
                                                                        <Spacer h gap="4" justifyContent="start" noWrap>
                                                                            <div>
                                                                                <div
                                                                                    style={{
                                                                                        ...getStylesForStatusDot(id),
                                                                                    }}
                                                                                />
                                                                            </div>

                                                                            <div>{getLabelForStatus(id)}</div>
                                                                        </Spacer>
                                                                    </Wrapper>
                                                                )}
                                                                inlineLabel
                                                                labelHidden
                                                                required
                                                            />
                                                        </div>
                                                    ),

                                                ].map((element, i) => (
                                                    <React.Fragment key={i}>
                                                        {element}
                                                    </React.Fragment>
                                                ));

                                                return rowIndex === 0
                                                    ? extraColumns
                                                    : (
                                                        <>
                                                            {
                                                                range(0, additionalColumnCount)
                                                                    .map((_, i) => <span key={i} />)
                                                            }
                                                        </>
                                                    );
                                            };

                                            return (
                                                <WithWorkingHoursEditor
                                                    key={weekday.index}
                                                    value={scheduleRecord.working_hours ?? []}
                                                    onChange={(val) => {
                                                        this.handleScheduleItemChange(
                                                            weekday.index,
                                                            {working_hours: val},
                                                        );
                                                    }}
                                                >
                                                    {(props) => {
                                                        const labels: Array<React.ReactNode> = [
                                                            ...range(0, additionalColumnCount)
                                                                .map((_, i) => <span key={i} />),
                                                        ];

                                                        if (renderLabels) {
                                                            labels.push(...props.labels);
                                                        } else {
                                                            labels.push(
                                                                ...range(
                                                                    0,
                                                                    workingHoursEditorColumnCount,
                                                                ).map((_, i) => <span key={i} />),
                                                            );
                                                        }

                                                        return (
                                                            <React.Fragment key={enabledWeekdayIndex}>
                                                                {
                                                                    enabledWeekdayIndex === 0
                                                                        ? labels.map((node, i) => (
                                                                            <React.Fragment key={i}>
                                                                                {node}
                                                                            </React.Fragment>
                                                                        ))
                                                                        : null
                                                                }

                                                                {
                                                                    props.inputs.map((rowInputs, rowIndex) => {
                                                                        const emptyColumns =
                                                                            range(0, workingHoursEditorColumnCount)
                                                                                .map((_, i) => <span key={i} />);

                                                                        // if status is not partial,
                                                                        // do not show columns from HOC
                                                                        const baseColumns =
                                                                            scheduleRecord.status === 'partial'
                                                                                ? <>{...rowInputs}</>
                                                                                : <>{...emptyColumns}</>;

                                                                        return (
                                                                            <React.Fragment key={rowIndex}>
                                                                                {getExtraColumns(rowIndex)}
                                                                                {baseColumns}
                                                                            </React.Fragment>
                                                                        );
                                                                    })
                                                                }
                                                            </React.Fragment>
                                                        );
                                                    }}
                                                </WithWorkingHoursEditor>
                                            );
                                        })
                                }
                            </div>
                        )
                    }

                    {
                        Object.keys(this.state.validationErrors).length > 0 && (
                            <div ref={this.errorsElementRef}>
                                <Alert style="hollow" type="alert">
                                    <Spacer v gap="8" noWrap>
                                        <Label text={gettext('Errors')} type="alert" />

                                        {
                                            Object.entries(this.state.validationErrors).map(([weekdayIndex, error]) => {
                                                return (
                                                    <Spacer h gap="8" justifyContent="start" noWrap key={weekdayIndex}>
                                                        <strong>
                                                            {weekdaysKeyed[weekdayIndex].nameLong}
                                                        </strong>

                                                        <span>{error}</span>
                                                    </Spacer>
                                                );
                                            })
                                        }
                                    </Spacer>
                                </Alert>
                            </div>
                        )
                    }
                </Spacer>
            </Modal>
        );
    }
}
