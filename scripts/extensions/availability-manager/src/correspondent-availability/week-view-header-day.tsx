import * as React from 'react';
import {isToday} from 'date-fns';
import {getWeekdayNames, Spacer} from '@sourcefabric/common';
import {keyBy} from 'lodash';
import {superdesk} from '../superdesk';

const {locale} = superdesk.localization;

const weekdaysKeyed = keyBy(
    getWeekdayNames(locale.firstDayOfWeek, locale.code),
    ({index}) => index,
);

interface IProps {
    day: Date;
}

export class WeekViewHeaderDay extends React.PureComponent<IProps> {
    render() {
        const {day} = this.props;
        const today = isToday(day);

        return (
            <Spacer v gap="4" noWrap>
                <div
                    style={{
                        textAlign: 'center',
                        width: '100%',
                        fontWeight: 'bold',
                        color: today
                            ? 'var(--sd-colour-interactive--darken-20)'
                            : undefined,
                    }}
                >
                    {weekdaysKeyed[day.getDay()].nameShort}
                </div>

                <div
                    style={{
                        width: '100%',
                        textAlign: 'center',
                    }}
                >
                    <span
                        style={{
                            display: 'inline-flex',
                            minWidth: 30,
                            minHeight: 30,
                            justifyContent: 'center',
                            alignItems: 'center',
                            aspectRatio: '1 / 1',
                            padding: 'var(--space--0-5)',
                            borderRadius: 9999,
                            background: today
                                ? 'var(--sd-colour-interactive--lighten-40)'
                                : undefined,
                        }}
                    >
                        {day.getDate()}
                    </span>
                </div>
            </Spacer>
        );
    }
}
