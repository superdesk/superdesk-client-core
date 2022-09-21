import * as React from 'react';
import {getDurationString, Tag} from 'superdesk-ui-framework/react';
import {IRundownFilters, IShow} from '../../../interfaces';

import {superdesk} from '../../../superdesk';

const {WithLiveResources, Spacer} = superdesk.components;

const {gettext} = superdesk.localization;

interface IProps {
    filters: IRundownFilters;
    onChange(filters: IRundownFilters): void;
}

export class AppliedFilters extends React.PureComponent<IProps> {
    render() {
        const {filters} = this.props;

        return (
            <Spacer h gap="4" justifyContent="start" noWrap style={{flexWrap: 'wrap'}}>
                {
                    filters.show != null && (
                        <WithLiveResources resources={[{resource: 'shows', ids: [filters.show]}]}>
                            {(res) => {
                                const show: IShow = res[0]._items[0];

                                return (
                                    <Tag
                                        text={show.title}
                                        label={gettext('Show')}
                                        onClick={() => {
                                            const copy = {...filters};

                                            delete copy.show;

                                            this.props.onChange(copy);
                                        }}
                                    />
                                );
                            }}
                        </WithLiveResources>
                    )
                }

                {
                    filters.airtime_time?.gt != null && (
                        <Tag
                            text={filters.airtime_time.gt}
                            label={gettext('Airtime time from')}
                            onClick={() => {
                                const copy = {...filters};

                                if (copy.airtime_time?.gt != null) {
                                    delete copy.airtime_time.gt;

                                    this.props.onChange(copy);
                                }
                            }}
                        />
                    )
                }

                {
                    filters.airtime_time?.lt != null && (
                        <Tag
                            text={filters.airtime_time.lt}
                            label={gettext('Airtime time to')}
                            onClick={() => {
                                const copy = {...filters};

                                if (copy.airtime_time?.lt != null) {
                                    delete copy.airtime_time.lt;

                                    this.props.onChange(copy);
                                }
                            }}
                        />
                    )
                }

                {
                    filters.airtime_date?.gt != null && (
                        <Tag
                            text={filters.airtime_date.gt}
                            label={gettext('Airtime date from')}
                            onClick={() => {
                                const copy = {...filters};

                                if (copy.airtime_date?.gt != null) {
                                    delete copy.airtime_date.gt;

                                    this.props.onChange(copy);
                                }
                            }}
                        />
                    )
                }

                {
                    filters.airtime_date?.lt != null && (
                        <Tag
                            text={filters.airtime_date.lt}
                            label={gettext('Airtime date to')}
                            onClick={() => {
                                const copy = {...filters};

                                if (copy.airtime_date?.lt != null) {
                                    delete copy.airtime_date.lt;

                                    this.props.onChange(copy);
                                }
                            }}
                        />
                    )
                }

                {
                    filters.duration?.gt != null && (
                        <Tag
                            text={getDurationString(filters.duration.gt)}
                            label={gettext('Duration from')}
                            onClick={() => {
                                const copy = {...filters};

                                if (copy.duration?.gt != null) {
                                    delete copy.duration.gt;

                                    this.props.onChange(copy);
                                }
                            }}
                        />
                    )
                }

                {
                    filters.duration?.lt != null && (
                        <Tag
                            text={getDurationString(filters.duration.lt)}
                            label={gettext('Duration to')}
                            onClick={() => {
                                const copy = {...filters};

                                if (copy.duration?.lt != null) {
                                    delete copy.duration.lt;

                                    this.props.onChange(copy);
                                }
                            }}
                        />
                    )
                }
            </Spacer>
        );
    }
}
