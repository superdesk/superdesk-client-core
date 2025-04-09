/* eslint-disable react/no-multi-comp */

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {addMonths, format, startOfMonth, endOfMonth} from 'date-fns';
import {keyBy, range} from 'lodash';
import {MonthCalendar, nameof, showModal, Spacer, SpacerBlock} from '@sourcefabric/common';
import {Button, getTextColor, IconButton, PopupPositioner} from 'superdesk-ui-framework/react';
import {IBaseRestApiResponse, ISuperdeskQuery, IUserProfileSection} from 'superdesk-api';
import {superdesk} from '../superdesk';
import {Card} from '../card';
import {IAvailabilityRecord, IDefaultAvailability} from '../interfaces';
import {WorkingDayView} from './working-day-view';
import {EditWorkdayModal} from './edit-workday-modal';
import {getStatusColor, getTags, setUserAvailability} from '../utils';
import {ManageScheduleModal} from './manage-schedule';
import {LANGUAGES_VOCABULARY, TAGS_VOCABULARY_ID} from '../constants';

const {httpRequestVoidLocal, httpRequestJsonLocal} = superdesk;
const {locale, gettext} = superdesk.localization;
const {VocabularySelect} = superdesk.components;
const {firstDayOfWeek} = superdesk.localization.locale;
const {assertNever} = superdesk.helpers;
const WithAvailabilityRecordsQuery = superdesk.components.getLiveQueryHOC<IAvailabilityRecord>();

const verticalSpacing = '1.6rem';

const Page: React.ComponentType<{children: React.ReactNode}> = (props) => (
    <div style={{display: 'flex', justifyContent: 'center'}}>
        <div style={{margin: '2rem'}}>
            <Card paddingBase="3">
                {props.children}
            </Card>
        </div>
    </div>
);

type IProps = React.ComponentProps<IUserProfileSection['component']>;

interface IState {
    defaultAvailability: IDefaultAvailability | null;
    calendarStart: Date;
    overlay:
        null
        | {kind: 'view'; date: string}
        | {kind: 'edit'; date: string}
        | {kind: 'create'; date: string};
    savingLanguages: boolean;
    savingTags: boolean;
    count: number;
}

function getQuery(
    options: {
        dateFrom: string,
        dateTo: string,
    },
): ISuperdeskQuery {
    const {dateFrom, dateTo} = options;

    return {
        filter: {
            $and: [
                {[nameof<IAvailabilityRecord>('date')]: {$gte: dateFrom}},
                {[nameof<IAvailabilityRecord>('date')]: {$lte: dateTo}},
            ],
        },
        page: 1,
        max_results: 200,
        sort: [{'versioncreated': 'asc'}], // sorting isn't relevant
    } satisfies ISuperdeskQuery;
}

export class AvailabilitySettings extends React.PureComponent<IProps, IState> {
    private dayRefs: {[key: string]: React.RefObject<HTMLDivElement>};

    constructor(props: IProps) {
        super(props);

        this.state = {
            calendarStart: startOfMonth(new Date()),
            overlay: null,
            defaultAvailability: null,
            savingLanguages: false,
            savingTags: false,
            count: 1,
        };

        this.dayRefs = {};
    }

    componentDidMount(): void {
        httpRequestJsonLocal<IDefaultAvailability>({
            method: 'GET',
            path: `/default_user_availability/${this.props.user._id}`,
        }).then((res) => {
            this.setState({defaultAvailability: res});
        }).catch(() => {
            // hasn't been set yet, keep it `null`
        });
    }

    render() {
        const languagesVocabulary = superdesk.entities.vocabulary.getVocabulary(LANGUAGES_VOCABULARY);
        const tagsVocabulary = superdesk.entities.vocabulary.getVocabulary(TAGS_VOCABULARY_ID);

        const monthsToDisplayAtOnce = 4;
        const months: Array<Date> =
            range(0, monthsToDisplayAtOnce)
                .map((toAdd) => addMonths(this.state.calendarStart, toAdd));

        const calendarEnd = endOfMonth(months[months.length - 1]);

        const query = getQuery({
            dateFrom: format(months[0], 'yyyy-MM-dd'),
            dateTo: format(calendarEnd, 'yyyy-MM-dd'),
        });

        const tagsWhitelist = new Set(
            (this.state.defaultAvailability?.tags ?? [])
                .map(({code}) => code),
        );

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
                                <div>
                                    <VocabularySelect
                                        label={{text: languagesVocabulary.display_name}}
                                        value={this.state.defaultAvailability?.language ?? []}
                                        getOptions={() => languagesVocabulary.items}
                                        onChange={(val) => {
                                            this.setState({savingLanguages: true});

                                            setUserAvailability(
                                                this.props.user._id,
                                                this.state.defaultAvailability,
                                                {
                                                    language: val,
                                                },
                                            )
                                                .then((res) => {
                                                    this.setState({
                                                        defaultAvailability: res,
                                                    });
                                                })
                                                .finally(() => {
                                                    this.setState({savingLanguages: false});
                                                });
                                        }}
                                        disabled={this.state.savingLanguages}
                                        multiple={false}
                                        fullWidth={true}
                                    />
                                </div>

                                <SpacerBlock v gap="16" />

                                <div>
                                    <VocabularySelect
                                        label={{text: tagsVocabulary.display_name}}
                                        value={(this.state.defaultAvailability?.tags ?? []).map(({code}) => code)}
                                        getOptions={() => {
                                            return getTags(
                                                tagsWhitelist,
                                                new Set<string>(
                                                    (this.state.defaultAvailability?.tags ?? []).map(({code}) => code),
                                                ),
                                            );
                                        }}
                                        onChange={(val) => {
                                            this.setState({savingTags: true});

                                            setUserAvailability(
                                                this.props.user._id,
                                                this.state.defaultAvailability,
                                                {
                                                    tags: val.map((qcode) => ({code: qcode})),
                                                },
                                            )
                                                .then((res) => {
                                                    this.setState({
                                                        defaultAvailability: res,
                                                    });
                                                })
                                                .finally(() => {
                                                    this.setState({savingTags: false});
                                                });
                                        }}
                                        disabled={this.state.savingTags}
                                        fullWidth={true}
                                        multiple={true}
                                        selectBranchWithChildren={true}
                                    />
                                </div>

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
                                            showModal(({closeModal}) => (
                                                <ManageScheduleModal onClose={closeModal} user={this.props.user} />
                                            ));
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
                                                        tagsWhitelist={tagsWhitelist}
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
