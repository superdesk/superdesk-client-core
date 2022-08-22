import * as React from 'react';

import {WithSizeObserver, ContentListItem, Label, IconButton} from 'superdesk-ui-framework/react';
import {IRundown} from '../../interfaces';

import {superdesk} from '../../superdesk';
import {DurationLabel} from './components/duration-label';
import {PlannedDurationLabel} from './components/planned-duration-label';
import {addSeconds} from '@superdesk/common';

const {VirtualListFromQuery, DateTime} = superdesk.components;
const {gettext} = superdesk.localization;

interface IProps {
    inEditMode: IRundown['_id'] | null;
    onEditModeChange(inEditMode: IRundown['_id'] | null): void;
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
                            sort: [{_updated: 'desc'}],
                        }}
                        itemTemplate={({item}: {item: IRundown}) => (
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
                                                                {item.airtime_time}
                                                                -
                                                                {addSeconds(item.airtime_time, item.duration)}
                                                            </span>

                                                            {
                                                                item.duration != null && (
                                                                    <DurationLabel
                                                                        duration={item.duration}
                                                                        planned_duration={item.planned_duration}
                                                                    />
                                                                )
                                                            }

                                                            <PlannedDurationLabel
                                                                planned_duration={item.planned_duration}
                                                            />

                                                            <DateTime dateTime={item._updated ?? item._created} />
                                                        </React.Fragment>
                                                    ),
                                                },
                                                {
                                                    content:
                                                    <React.Fragment>
                                                        <Label text="[show name]" color="blue--800" />

                                                        <span className="sd-list-item__compound-text">
                                                            <span className="sd-list-item__text-label">
                                                                {gettext('Template')}
                                                            </span>
                                                            <span>[template-name]</span>
                                                        </span>

                                                        <span
                                                            className={[
                                                                'sd-overflow-ellipsis',
                                                                'sd-list-item--element-grow',
                                                                'sd-list-item__headline',
                                                            ].join(' ')}
                                                        >
                                                            {item.title}
                                                        </span>

                                                        <span>[status]</span>
                                                    </React.Fragment>,
                                                },
                                            ],
                                            fullwidth: true,
                                        },
                                    ]}
                                    locked={false}
                                    action={(
                                        <IconButton
                                            icon="dots-vertical"
                                            ariaValue={gettext('Actions')}
                                            onClick={() => false} // TODO: implement actions
                                        />
                                    )}
                                    loading={false}
                                    activated={false}
                                    selected={false}
                                    archived={false}
                                    onClick={() => {
                                        this.props.onEditModeChange(item._id);
                                    }}
                                />
                            </div>
                        )}
                        noItemsTemplate={() => <span>{gettext('There are no rundowns yet')}</span>}
                    />
                )}
            </WithSizeObserver>
        );
    }
}
