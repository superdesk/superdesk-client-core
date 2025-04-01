/* eslint-disable react/no-multi-comp */

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {addMonths, format, startOfMonth, endOfMonth} from 'date-fns';
import {keyBy, range} from 'lodash';
import {MonthCalendar, nameof, showModal, Spacer, SpacerBlock} from '@sourcefabric/common';
import {Button, getTextColor, IconButton, PopupPositioner} from 'superdesk-ui-framework/react';
import {IBaseRestApiResponse, ISuperdeskQuery, IUser, IUserProfileSection} from 'superdesk-api';
import {superdesk} from '../superdesk';
import {Card} from '../card';
import {IAvailabilityRecord} from '../interfaces';
import {WorkingDayView} from './working-day-view';
import {EditWorkdayModal} from './edit-workday-modal';
import {getStatusColor} from '../utils';
import {ManageScheduleModal} from './manage-schedule';

const {httpRequestVoidLocal} = superdesk;
const {locale, gettext} = superdesk.localization;
const {firstDayOfWeek} = superdesk.localization.locale;
const {assertNever} = superdesk.helpers;
const WithAvailabilityRecordsQuery = superdesk.components.getLiveQueryHOC<IAvailabilityRecord>();

const verticalSpacing = '1.4rem';

const Page: React.ComponentType<{children: React.ReactNode}> = (props) => (
    <div style={{display: 'flex', justifyContent: 'center'}}>
        <div style={{margin: '2rem'}}>
            <Card paddingBase="3" paddingBlockStart={0}>
                {props.children}
            </Card>
        </div>
    </div>
);

type IProps = React.ComponentProps<IUserProfileSection['component']>;

interface IState {
    user: IUser;
    calendarStart: Date;
    overlay:
        null
        | {kind: 'view'; date: string}
        | {kind: 'edit'; date: string}
        | {kind: 'create'; date: string};
}

export class AvailabilitySettings extends React.PureComponent<IProps, IState> {
    private dayRefs: {[key: string]: React.RefObject<HTMLDivElement>};

    constructor(props: IProps) {
        super(props);

        this.state = {
            user: props.user,
            calendarStart: startOfMonth(new Date()),
            overlay: null,
        };

        this.dayRefs = {};
    }

    render() {
        const monthsToDisplayAtOnce = 4;
        const months: Array<Date> =
            range(0, monthsToDisplayAtOnce)
                .map((toAdd) => addMonths(this.state.calendarStart, toAdd));

        const calendarEnd = endOfMonth(months[months.length - 1]);

        const query: ISuperdeskQuery = {
            filter: {
                $and: [
                    {[nameof<IAvailabilityRecord>('date')]: {$gte: format(months[0], 'yyyy-MM-dd')}},
                    {[nameof<IAvailabilityRecord>('date')]: {$lte: format(calendarEnd, 'yyyy-MM-dd')}},
                ],
            },
            page: 1,
            max_results: 200,
            sort: [{'versioncreated': 'asc'}], // sorting isn't relevant
        };

        return (
            <Page>
                <WithAvailabilityRecordsQuery resource="user_availability" query={query}>
                    {(res) => {
                        const grouped = keyBy(res._items, (item) => item.date);

                        const dayTemplate: React.ComponentProps<typeof MonthCalendar>['dayTemplate'] = (props) => {
                            const {day, dayFromOtherMonth} = props.day;

                            const dateKey = format(props.day.date, 'yyyy-MM-dd');
                            const workingDay: IAvailabilityRecord | null = grouped[dateKey];

                            if (this.dayRefs[dateKey] == null) {
                                this.dayRefs[dateKey] = React.createRef<HTMLDivElement>();
                            }

                            const background: React.CSSProperties['background'] = (() => {
                                if (dayFromOtherMonth || workingDay == null) {
                                    return undefined;
                                } else {
                                    return getStatusColor(workingDay.status);
                                }
                            })();

                            return (
                                <div
                                    key={day}
                                    ref={this.dayRefs[dateKey]}
                                    style={{
                                        opacity: dayFromOtherMonth ? 0.5 : undefined,
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        color: background == null ? undefined : getTextColor(background),
                                        background: background,
                                        borderRadius: 20,
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => {
                                        this.setState({
                                            overlay: {kind: workingDay == null ? 'create' : 'view', date: dateKey},
                                        });
                                    }}
                                >
                                    {day}
                                </div>
                            );
                        };

                        return (
                            <div>
                                <Spacer
                                    h
                                    gap="16"
                                    noWrap
                                    justifyContent="space-between"
                                    style={{paddingBlock: verticalSpacing}}
                                >
                                    <Spacer h gap="0" noGrow>
                                        <IconButton
                                            icon="chevron-left-thin"
                                            ariaValue={gettext('Previous')}
                                            onClick={() => {
                                                this.setState({
                                                    calendarStart: addMonths(
                                                        this.state.calendarStart,
                                                        -monthsToDisplayAtOnce,
                                                    ),
                                                });
                                            }}
                                        />
                                        <IconButton
                                            icon="chevron-right-thin"
                                            ariaValue={gettext('Next')}
                                            onClick={() => {
                                                this.setState({
                                                    calendarStart: addMonths(
                                                        this.state.calendarStart,
                                                        monthsToDisplayAtOnce,
                                                    ),
                                                });
                                            }}
                                        />

                                        <SpacerBlock h gap="8" />

                                        <h3>{gettext('Availability schedule')}</h3>
                                    </Spacer>

                                    <Button
                                        text={gettext('Manage')}
                                        style="hollow"
                                        onClick={() => {
                                            showModal(({closeModal}) => <ManageScheduleModal onClose={closeModal} />);
                                        }}
                                    />
                                </Spacer>

                                <hr
                                    style={{borderColor: 'graylight', marginBlock: 0, marginBlockEnd: verticalSpacing}}
                                />

                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, auto)',
                                        gridRowGap: '1.4rem',
                                        columnGap: '2.8rem',
                                        placeItems: 'start',
                                    }}
                                >
                                    {
                                        months.map((month, i) => (
                                            <MonthCalendar
                                                key={i}
                                                month={month}
                                                firstDayOfWeek={firstDayOfWeek}
                                                locale={locale.code}
                                                dayTemplate={dayTemplate}
                                            />
                                        ))
                                    }
                                </div>

                                {(() => {
                                    const {overlay} = this.state;

                                    if (overlay == null) {
                                        return null;
                                    } else if (overlay.kind === 'view') {
                                        const handleClose = () => {
                                            this.setState({overlay: null});
                                        };

                                        const workingDay = grouped[overlay.date];

                                        /**
                                         * After creating a new item we might switch to view mode.
                                         * It takes a moment for live query to pick up the new item
                                         * We render `null` initially and when the item arrives,
                                         * it will render the intended component.
                                         */
                                        if (workingDay == null) {
                                            return null;
                                        }

                                        return (
                                            <PopupPositioner
                                                getReferenceElement={
                                                    () => this.dayRefs[overlay.date].current as HTMLElement
                                                }
                                                placement="bottom-end"
                                                onClose={handleClose}
                                            >
                                                <Card paddingBase="0">
                                                    <WorkingDayView
                                                        day={workingDay}
                                                        onEdit={() => {
                                                            handleClose();
                                                            this.setState({
                                                                overlay: {kind: 'edit', date: overlay.date},
                                                            });
                                                        }}
                                                        onRemove={() => {
                                                            httpRequestVoidLocal({
                                                                method: 'DELETE',
                                                                path: `/user_availability/${workingDay._id}`,
                                                                headers: {
                                                                    'If-Match': workingDay._etag,
                                                                },
                                                            }).then(() => {
                                                                handleClose();
                                                            });
                                                        }}
                                                        onClose={handleClose}
                                                    />
                                                </Card>
                                            </PopupPositioner>
                                        );
                                    } else if (overlay.kind === 'edit' || overlay.kind === 'create') {
                                        const handleClose = () => {
                                            this.setState({overlay: null});
                                        };

                                        const workingDay = grouped[overlay.date];

                                        const referenceElement = this.dayRefs[overlay.date].current;

                                        if (referenceElement == null) {
                                            throw new Error();
                                        }

                                        return (
                                            ReactDOM.createPortal(
                                                (
                                                    <EditWorkdayModal
                                                        workingDay={(() => {
                                                            if (overlay.kind === 'edit') {
                                                                return {kind: 'saved', value: workingDay};
                                                            } else if (overlay.kind === 'create') {
                                                                return {
                                                                    kind: 'draft',
                                                                    template: {
                                                                        date: overlay.date,
                                                                        status: 'available',
                                                                    } satisfies Omit<
                                                                        IAvailabilityRecord, keyof IBaseRestApiResponse
                                                                    >,
                                                                };
                                                            } else {
                                                                return assertNever(overlay);
                                                            }
                                                        })()}
                                                        onClose={(item) => {
                                                            handleClose();

                                                            if (item?.status === 'partial') {
                                                                this.setState({
                                                                    overlay: {kind: 'view', date: overlay.date},
                                                                });
                                                            } else {
                                                                this.setState({overlay: null});
                                                            }
                                                        }}
                                                    />
                                                ),
                                                document.body,
                                            )
                                        );
                                    } else {
                                        return assertNever(overlay);
                                    }
                                })()}
                            </div>
                        );
                    }}
                </WithAvailabilityRecordsQuery>
            </Page>
        );
    }
}
