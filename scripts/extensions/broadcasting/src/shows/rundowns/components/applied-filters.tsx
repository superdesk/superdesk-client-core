import * as React from 'react';
import {Tag} from 'superdesk-ui-framework/react';
import {IRundownFilters, IShow} from '../../../interfaces';

import {superdesk} from '../../../superdesk';

const {WithLiveResources} = superdesk.components;

const {gettext} = superdesk.localization;

interface IProps {
    filters: IRundownFilters;
    onChange(filters: IRundownFilters): void;
}

export class AppliedFilters extends React.PureComponent<IProps> {
    render() {
        const {filters} = this.props;

        if (filters.show == null) {
            return null;
        } else {
            return (
                <WithLiveResources resources={[{resource: 'shows', ids: [filters.show]}]}>
                    {(res) => {
                        const show: IShow = res[0]._items[0];

                        return (
                            <Tag
                                text={show.title}
                                label={gettext('Show')}
                                onClick={() => {
                                    const copy = {...filters};

                                    delete copy['show'];

                                    this.props.onChange(copy);
                                }}
                            />
                        );
                    }}
                </WithLiveResources>
            );
        }
    }
}
