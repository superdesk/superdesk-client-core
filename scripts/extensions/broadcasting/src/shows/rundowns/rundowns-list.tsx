import * as React from 'react';

import {WithSizeObserver, ContentListItem, Label, IconButton, Menu, Alert} from 'superdesk-ui-framework/react';
import {IRundown, IRundownFilters, IRundownTemplate, IShow} from '../../interfaces';

import {superdesk} from '../../superdesk';
import {DurationLabel} from './components/duration-label';
import {PlannedDurationLabel} from './components/planned-duration-label';
import {addSeconds} from '@superdesk/common';
import {IAndOperator, ILogicalOperator} from 'superdesk-api';
import {RundownItems} from './components/rundown-items';
import {prepareForPreview} from './prepare-create-edit';
import {IRundownItemAction} from './template-edit';
import {Dropdown, IMenuItem} from 'superdesk-ui-framework/react/components/Dropdown';
import {noop} from 'lodash';

const {httpRequestRawLocal} = superdesk;
const {getVirtualListFromQuery, DateTime} = superdesk.components;
const {gettext} = superdesk.localization;

const VirtualListFromQuery = getVirtualListFromQuery<IRundown, {show: IShow; template: IRundownTemplate}>();

interface IProps {
    searchString: string;
    inEditMode: IRundown['_id'] | null;
    onEditModeChange(inEditMode: IRundown['_id'] | null, rundownItemAction?: IRundownItemAction): void;
    filters?: IRundownFilters;
    rundownItemAction: IRundownItemAction;
}

function getFilters(filters: IRundownFilters | undefined): ILogicalOperator | undefined {
    const queryFilters: IAndOperator['$and'] = [];

    if (filters?.show != null) {
        queryFilters.push({show: {$eq: filters.show}});
    }

    if (filters?.airtime_time?.gte != null) {
        queryFilters.push({airtime_time: {$gte: filters.airtime_time.gte}});
    }

    if (filters?.airtime_time?.lte != null) {
        queryFilters.push({airtime_time: {$lte: filters.airtime_time.lte}});
    }

    if (filters?.airtime_date?.gte != null) {
        queryFilters.push({airtime_date: {$gte: filters.airtime_date.gte}});
    }

    if (filters?.airtime_date?.lte != null) {
        queryFilters.push({airtime_date: {$lte: filters.airtime_date.lte}});
    }

    if (filters?.duration?.gte != null && filters.duration.gte !== 0) {
        queryFilters.push({duration: {$gte: filters.duration.gte}});
    }

    if (filters?.duration?.lte != null && filters.duration.lte !== 0) {
        queryFilters.push({duration: {$lte: filters.duration.lte}});
    }

    if (queryFilters.length < 1) {
        return undefined;
    } else {
        return {
            $and: queryFilters,
        };
    }
}

export class RundownsList extends React.PureComponent<IProps> {
    render() {
        return (
            <WithSizeObserver style={{display: 'flex', margin: -4}}>
                {({width, height}) => (
                    <VirtualListFromQuery
                        width={width}
                        height={height}
                        query={{
                            endpoint: '/rundowns',
                            fullTextSearch: this.props.searchString.trim().length < 1
                                ? undefined
                                : this.props.searchString,
                            sort: [{_updated: 'desc'}],
                            filter: getFilters(this.props.filters),
                            join: {
                                show: {
                                    endpoint: '/shows',
                                    getId: (rundown) => rundown.show,
                                },
                                template: {
                                    endpoint: (rundown) => `/shows/${rundown.show}/templates`,
                                    getId: (rundown) => rundown.template,
                                },
                            },
                        }}
                        itemTemplate={({entity: rundown, joined}) => (
                            <div style={{margin: 4}}>
                                <ContentListItem
                                    itemColum={[
                                        {
                                            itemRow: [
                                                {
                                                    content: (
                                                        <i className="icon-rundown" />
                                                    ),
                                                },
                                            ],
                                            border: true,
                                        },
                                        {
                                            itemRow: [
                                                {
                                                    content: (
                                                        <React.Fragment>
                                                            <span className="sd-list-item__slugline">
                                                                {rundown.airtime_time}
                                                                &nbsp;
                                                                -
                                                                &nbsp;
                                                                {
                                                                    addSeconds(
                                                                        rundown.airtime_time,
                                                                        (rundown.duration ?? rundown.planned_duration),
                                                                    )
                                                                }
                                                            </span>

                                                            {
                                                                rundown.duration != null && (
                                                                    <DurationLabel
                                                                        duration={rundown.duration}
                                                                        planned_duration={rundown.planned_duration}
                                                                        size="small"
                                                                    />
                                                                )
                                                            }

                                                            <PlannedDurationLabel
                                                                planned_duration={rundown.planned_duration}
                                                                size="small"
                                                            />

                                                            {
                                                                rundown._updated !== rundown._created
                                                                    ? (
                                                                        <DateTime
                                                                            dateTime={rundown._updated}
                                                                            tooltip={(dateLong) => gettext(
                                                                                'Updated at {{date}}',
                                                                                {date: dateLong},
                                                                            )}
                                                                        />
                                                                    )
                                                                    : (
                                                                        <DateTime
                                                                            dateTime={rundown._created}
                                                                            tooltip={(dateLong) => gettext(
                                                                                'Created at {{date}}',
                                                                                {date: dateLong},
                                                                            )}
                                                                        />
                                                                    )
                                                            }
                                                        </React.Fragment>
                                                    ),
                                                },
                                                {
                                                    content:
                                                    <React.Fragment>
                                                        {
                                                            joined.show != null && (
                                                                <Label text={joined.show.title} color="blue--800" />
                                                            )
                                                        }

                                                        {
                                                            joined.template != null && (
                                                                <span className="sd-list-item__compound-text">
                                                                    <span className="sd-list-item__text-label">
                                                                        {gettext('Template')}
                                                                    </span>
                                                                    <span>{joined.template.title}</span>
                                                                </span>
                                                            )
                                                        }

                                                        <span
                                                            className={[
                                                                'sd-overflow-ellipsis',
                                                                'sd-list-item--element-grow',
                                                                'sd-list-item__headline',
                                                            ].join(' ')}
                                                        >
                                                            {rundown.title}
                                                        </span>

                                                        {/* TODO: restore <span>[status]</span> */}
                                                    </React.Fragment>,
                                                },
                                            ],
                                            fullwidth: true,
                                        },
                                    ]}
                                    locked={false}
                                    action={(
                                        <Menu // TODO: verify that ui-framework#667 is fixed
                                            items={[
                                                {
                                                    label: gettext('Edit'),
                                                    onClick: () => {
                                                        this.props.onEditModeChange(rundown._id);
                                                    },
                                                },
                                                {
                                                    label: gettext('Delete'),
                                                    onClick: () => {
                                                        httpRequestRawLocal({
                                                            method: 'DELETE',
                                                            path: `/rundowns/${rundown._id}`,
                                                            headers: {
                                                                'If-Match': rundown._etag,
                                                            },
                                                        });
                                                    },
                                                },
                                            ]}
                                        >
                                            {(toggle) => (
                                                <IconButton
                                                    icon="dots-vertical"
                                                    ariaValue={gettext('Actions')}
                                                    onClick={toggle}
                                                />
                                            )}
                                        </Menu>
                                    )}
                                    loading={false}
                                    activated={false}
                                    selected={rundown._id === this.props.inEditMode}
                                    archived={false}
                                    onClick={() => {
                                        this.props.onEditModeChange(rundown._id);
                                    }}
                                />
                                {
                                    rundown.matching_items && (
                                        <div style={{paddingInlineStart: 20, paddingTop: 8}}>
                                            <RundownItems
                                                readOnly={true}
                                                items={rundown.matching_items}
                                                getActions={((rundownItem) => {
                                                    const preview: IMenuItem = {
                                                        label: gettext('Preview'),
                                                        onSelect: () => {
                                                            this.props.onEditModeChange(
                                                                rundown._id,
                                                                prepareForPreview(
                                                                    this.props.rundownItemAction,
                                                                    rundownItem._id,
                                                                    rundownItem,
                                                                ),
                                                            );
                                                        },
                                                    };

                                                    return (
                                                        <Dropdown
                                                            items={[preview]}
                                                            append
                                                        >
                                                            <IconButton
                                                                ariaValue={gettext('Actions')}
                                                                icon="dots-vertical"
                                                                onClick={noop}
                                                            />
                                                        </Dropdown>
                                                    );
                                                })}
                                            />
                                        </div>
                                    )
                                }
                            </div>
                        )}
                        noItemsTemplate={() => {
                            if (this.props.searchString == null) {
                                return (
                                    <Alert>{gettext('There are no rundowns yet')}</Alert>
                                );
                            } else {
                                return (
                                    <Alert>
                                        {
                                            gettext('No items found matching search criteria')
                                        }
                                    </Alert>
                                );
                            }
                        }}
                    />
                )}
            </WithSizeObserver>
        );
    }
}
