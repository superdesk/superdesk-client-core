import React from 'react';
import {sdApi} from 'api';
import {OrderedMap} from 'immutable';
import {SelectFilterableNoLabels} from './select-filterable-no-labels';

interface IProps {
    value: string;
    onChange(value: string): void;
}

export class TimeZonePicker extends React.PureComponent<IProps> {
    private allTimeZones: OrderedMap<string, string>;

    constructor(props: IProps) {
        super(props);

        this.allTimeZones = sdApi.time.getTimeZones();
    }

    render() {
        const keys: Array<string> = this.allTimeZones.keySeq().toJS();

        return (
            <SelectFilterableNoLabels
                items={keys}
                value={this.props.value}
                onChange={(val) => this.props.onChange(val)}
                getLabel={(item) => this.allTimeZones.get(item)}
            />
        );
    }
}
