import React from 'react';
import moment from 'moment';
import {differenceInCalendarDays} from 'date-fns/differenceInCalendarDays';
import {format} from 'date-fns/format';
import {DatePicker} from 'superdesk-ui-framework/react';
import {IDateFieldConfig, IDateUserPreferences, IDateValueOperational, IEditorComponentProps} from 'superdesk-api';
import {appConfig} from 'appConfig';
import {dateToServerString} from 'core/get-superdesk-api-implementation';
import {getLocaleForDatePicker} from 'core/helpers/ui-framework';

type IProps = IEditorComponentProps<IDateValueOperational, IDateFieldConfig, IDateUserPreferences>;

export class Editor extends React.PureComponent<IProps> {
    render() {
        const Container = this.props.container;
        const {readOnly} = this.props;

        return (
            <Container>
                {/* not `DatePickerISO`, it has no empty state and shows a null value as 01/01/1970 */}
                <DatePicker
                    label=""
                    inlineLabel
                    labelHidden
                    required
                    value={(this.props.value ?? '') === '' ? null : new Date(this.props.value)}
                    onChange={(date) => {
                        if (date == null) {
                            this.props.onChange('');
                            return;
                        }

                        // a date-only string parses as UTC midnight, so the picked day is stored whatever the timezone
                        this.props.onChange(
                            dateToServerString(new Date(format(date, 'yyyy-MM-dd'))),
                        );
                    }}
                    dateFormat={appConfig.view.dateformat}
                    locale={{type: 'full', payload: getLocaleForDatePicker(this.props.language)}}
                    headerButtonBar={this.props.config?.shortcuts?.map(({label, value, term}) => {
                        return {
                            label,
                            days: differenceInCalendarDays(
                                moment().startOf('day').add(value, term).toDate(),
                                new Date(),
                            ),
                        };
                    })}
                    disabled={readOnly}
                />
            </Container>
        );
    }
}
