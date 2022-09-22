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
                    filters.airtime_time?.gte != null && (
                        <Tag
                            text={filters.airtime_time.gte}
                            label={gettext('Airtime time from')}
                            onClick={() => {
                                const copy = {...filters};

                                if (copy.airtime_time?.gte != null) {
                                    delete copy.airtime_time.gte;

                                    this.props.onChange(copy);
                                }
                            }}
                        />
                    )
                }

                {
                    filters.airtime_time?.lte != null && (
                        <Tag
                            text={filters.airtime_time.lte}
                            label={gettext('Airtime time to')}
                            onClick={() => {
                                const copy = {...filters};

                                if (copy.airtime_time?.lte != null) {
                                    delete copy.airtime_time.lte;

                                    this.props.onChange(copy);
                                }
                            }}
                        />
                    )
                }

                {
                    filters.airtime_date?.gte != null && (
                        <Tag
                            text={filters.airtime_date.gte}
                            label={gettext('Airtime date from')}
                            onClick={() => {
                                const copy = {...filters};

                                if (copy.airtime_date?.gte != null) {
                                    delete copy.airtime_date.gte;

                                    this.props.onChange(copy);
                                }
                            }}
                        />
                    )
                }

                {
                    filters.airtime_date?.lte != null && (
                        <Tag
                            text={filters.airtime_date.lte}
                            label={gettext('Airtime date to')}
                            onClick={() => {
                                const copy = {...filters};

                                if (copy.airtime_date?.lte != null) {
                                    delete copy.airtime_date.lte;

                                    this.props.onChange(copy);
                                }
                            }}
                        />
                    )
                }

                {
                    filters.duration?.gte != null && (
                        <Tag
                            text={getDurationString(filters.duration.gte)}
                            label={gettext('Duration from')}
                            onClick={() => {
                                const copy = {...filters};

                                if (copy.duration?.gte != null) {
                                    delete copy.duration.gte;

                                    this.props.onChange(copy);
                                }
                            }}
                        />
                    )
                }

                {
                    filters.duration?.lte != null && (
                        <Tag
                            text={getDurationString(filters.duration.lte)}
                            label={gettext('Duration to')}
                            onClick={() => {
                                const copy = {...filters};

                                if (copy.duration?.lte != null) {
                                    delete copy.duration.lte;

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
