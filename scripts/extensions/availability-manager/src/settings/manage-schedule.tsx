import * as React from 'react';
import {getWeekdayNames, Spacer} from '@sourcefabric/common';
import {keyBy, noop, range} from 'lodash';
import {Button, CheckboxButton, CheckButtonGroup, Modal} from 'superdesk-ui-framework/react';
import {
    availabilityStatuses,
    dayCodes,
    dayIndexesByDayCode,
    IDayIndex,
    tagsSelectWidth,
    TAGS_VOCABULARY_ID,
} from '../constants';
import {
    getFilteredTags,
    setUserAvailability,
    validateSchedule,
} from '../utils';
import {IDefaultAvailability, IScheduleRecord} from '../interfaces';
import {superdesk} from '../superdesk';
import {WithWorkingHoursEditor, workingHoursEditorColumnCount} from './edit-working-hours';
import {IUser} from 'superdesk-api';
import {ValidationErrors} from '../validation-errors';
import {WorkingHoursGridLabels} from './working-hours-grid-labels';
import {StatusSelect} from '../components/status-select';

const {locale} = superdesk.localization;
const {gettext} = superdesk.localization;
const {VocabularySelect} = superdesk.components;
const {httpRequestJsonLocal} = superdesk;

const placeholder: IScheduleRecord = {
    status: 'available',
    working_hours: [{tags: []}],
};

const additionalColumnCount = 2;

const additionalColumnsPlaceholder = (
    <>
        {
            range(0, additionalColumnCount).map((_, i) => <span key={i} />)
        }
    </>
);

/**
 * To use CSS grid, the number of columns need to be known in advance.
 * Since we reuse {@link WithWorkingHoursEditor} for every week day, it's difficult to work out
 * the number of columns dynamically.
 */
const columnCount = workingHoursEditorColumnCount + additionalColumnCount;

interface IProps {
    user: IUser;
    onClose(): void;
    tagsWhitelist: Set<string>;
}

interface IState {
    schedule: {[weekDayIndex: string]: IScheduleRecord};
    validationErrors: {[weekDayIndex: string]: string};
    defaultAvailabilityRecord: IDefaultAvailability | null;
    savingInProgress: boolean;
    initialized: boolean;
}

export class ManageScheduleModal extends React.PureComponent<IProps, IState> {
    private errorsElementRef: React.RefObject<HTMLDivElement>;
    private _mounted: boolean;

    constructor(props: IProps) {
        super(props);

        this.state = {
            schedule: {},
            defaultAvailabilityRecord: null,
            validationErrors: {},
            savingInProgress: false,
            initialized: false,
        };

        this.handleScheduleItemChange = this.handleScheduleItemChange.bind(this);
        this.handleRemoveScheduleItem = this.handleRemoveScheduleItem.bind(this);
        this.save = this.save.bind(this);

        this.errorsElementRef = React.createRef<HTMLDivElement>();

        this._mounted = false;
    }

    private handleScheduleItemChange(index: number, patch: Partial<IScheduleRecord>) {
        const update = {
            ...this.state.schedule[index],
            ...patch,
        };

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
            this.setState({savingInProgress: true});
            const initial: Required<IDefaultAvailability>['working_days'] = {};

            setUserAvailability(
                this.props.user._id,
                this.state.defaultAvailabilityRecord,
                {
                    working_days: Object.entries(this.state.schedule)
                        .reduce((acc, [index, value]) => {
                            acc[dayCodes[index as IDayIndex]] = value;

                            return acc;
                        }, initial),
                },
            ).then(() => {
                this.props.onClose();
            }).finally(() => {
                if (this._mounted) {
                    this.setState({savingInProgress: false});
                }
            });
        }
    }

    componentDidMount(): void {
        this._mounted = true;

        httpRequestJsonLocal<IDefaultAvailability>({
            method: 'GET',
            path: `/default_user_availability/${this.props.user._id}`,
        }).catch(noop).then((res) => {
            if (res == null) { // no value saved yet
                this.setState({
                    schedule: {},
                    defaultAvailabilityRecord: null,
                    initialized: true,
                });
            } else {
                this.setState({
                    schedule: Object.entries(res.working_days ?? {})
                        .reduce((acc: IState['schedule'], [dayCode, value]) => {
                            acc[dayIndexesByDayCode[dayCode]] = value;

                            return acc;
                        }, {}),
                    defaultAvailabilityRecord: res,
                    initialized: true,
                });
            }
        });
    }

    componentWillUnmount(): void {
        this._mounted = false;
    }

    render() {
        if (!this.state.initialized) {
            return null;
        }

        const weekdays = getWeekdayNames(locale.firstDayOfWeek, locale.code);
        const weekdaysKeyed = keyBy(weekdays, (weekday) => weekday.index);
        const enabledWeekdays = weekdays.filter(({index}) => this.state.schedule[index] != null);
        const hasPartialDays = Object.values(this.state.schedule).some(({status}) => status === 'partial');
        const tagsVocabulary = superdesk.entities.vocabulary.getAll().get(TAGS_VOCABULARY_ID);
        const {savingInProgress} = this.state;

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
                            disabled={savingInProgress}
                        />

                        <Button
                            text={gettext('Save')}
                            type="primary"
                            onClick={() => {
                                this.save();
                            }}
                            disabled={savingInProgress}
                            isLoading={savingInProgress}
                            noMargin
                        />
                    </Spacer>
                )}
                data-test-id="manage-schedule"
            >
                <Spacer v gap="16" noWrap style={{minWidth: 870}}>
                    <CheckButtonGroup data-test-id="weekdays">
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
                                    disabled={savingInProgress}
                                />
                            ))
                        }
                    </CheckButtonGroup>

                    {enabledWeekdays.length > 0 && (
                        <div
                            style={{
                                display: 'grid',
                                gap: 'var(--gap-1)',
                                gridTemplateColumns: range(0, columnCount).map(() => 'max-content').join(' '),
                            }}
                        >
                            <>
                                {additionalColumnsPlaceholder}
                                <WorkingHoursGridLabels showWorkingHoursLabel={hasPartialDays} />
                            </>

                            {
                                enabledWeekdays
                                    .filter(({index}) => this.state.schedule[index] != null)
                                    .map((weekday) => {
                                        const scheduleRecord = this.state.schedule[weekday.index];

                                        const getExtraColumns = () => {
                                            return (
                                                <>
                                                    <div>
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',

                                                                // needed to align label vertically with
                                                                // other inputs on the same row
                                                                // even when tag input wraps multiple lines
                                                                minHeight: 'var(--form-element-height-medium)',
                                                            }}
                                                        >
                                                            <strong>{weekday.nameLong}</strong>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <StatusSelect
                                                            allowNotSet={false}
                                                            label={{text: gettext('Status'), hidden: true}}
                                                            value={
                                                                [
                                                                    scheduleRecord.status,
                                                                ] as typeof availabilityStatuses
                                                            }
                                                            onChange={([val]) => {
                                                                this.handleScheduleItemChange(
                                                                    weekday.index,
                                                                    {status: val},
                                                                );
                                                            }}
                                                            required
                                                        />
                                                    </div>
                                                </>
                                            );
                                        };

                                        if (scheduleRecord.status === 'partial') {
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
                                                    tagsWhitelist={new Set(
                                                        (this.state.defaultAvailabilityRecord?.tags ?? [])
                                                            .map(({code}) => code),
                                                    )}
                                                    disabled={savingInProgress}
                                                    columnsBefore={({rowIndex}) => {
                                                        if (rowIndex === 0) {
                                                            return getExtraColumns();
                                                        } else {
                                                            return additionalColumnsPlaceholder;
                                                        }
                                                    }}
                                                />
                                            );
                                        } else {
                                            return (
                                                <React.Fragment key={weekday.index}>
                                                    {getExtraColumns()}

                                                    {
                                                        range(0, workingHoursEditorColumnCount)
                                                            .map((n) => <span key={`placeholder-${n}`} />)
                                                            .map((placeholderJsx, i) => {
                                                                const displayTagsSelectAtIndex = 0;

                                                                if (i !== displayTagsSelectAtIndex) {
                                                                    // placeholders needed for remaining columns
                                                                    // so it aligns correctly in the CSS grid
                                                                    return placeholderJsx;
                                                                }

                                                                const workingHours = scheduleRecord.working_hours;

                                                                const val = (
                                                                    workingHours?.[0]?.tags ?? []
                                                                ).map((a) => a.code);

                                                                return (
                                                                    <div style={{width: tagsSelectWidth}} key={i}>
                                                                        <VocabularySelect
                                                                            label={{
                                                                                text: tagsVocabulary.display_name,
                                                                                hidden: true,
                                                                            }}
                                                                            value={val}
                                                                            getOptions={() => getFilteredTags(
                                                                                new Set<string>(val),
                                                                                this.props.tagsWhitelist,
                                                                            )}
                                                                            onChange={(qcodes) => {
                                                                                this.handleScheduleItemChange(
                                                                                    weekday.index,
                                                                                    {working_hours: [
                                                                                        {
                                                                                            tags: qcodes.map(
                                                                                                (qcode) => {
                                                                                                    return {
                                                                                                        code: qcode,
                                                                                                    };
                                                                                                },
                                                                                            ),
                                                                                        },
                                                                                    ]},
                                                                                );
                                                                            }}
                                                                            multiple={true}
                                                                            fullWidth={true}
                                                                            disabled={this.state.savingInProgress}
                                                                            selectBranchWithChildren
                                                                            data-test-id="tags"
                                                                        />
                                                                    </div>
                                                                );
                                                            })
                                                    }
                                                </React.Fragment>
                                            );
                                        }
                                    })
                            }
                        </div>
                    )}

                    {
                        Object.keys(this.state.validationErrors).length > 0 && (
                            <ValidationErrors scrollRef={this.errorsElementRef}>
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
                            </ValidationErrors>
                        )
                    }
                </Spacer>
            </Modal>
        );
    }
}
