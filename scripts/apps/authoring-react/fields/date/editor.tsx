import React from 'react';
import moment from 'moment';
import differenceInCalendarDays from 'date-fns/differenceInCalendarDays';
import {DatePickerISO} from 'superdesk-ui-framework/react';
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
                <DatePickerISO
                    value={this.props.value}
                    onChange={(dateString) => {
                        if (dateString === '') {
                            this.props.onChange('');
                            return;
                        }

                        this.props.onChange(
                            dateToServerString(new Date(dateString)),
                        );
                    }}
                    dateFormat={appConfig.view.dateformat}
                    locale={getLocaleForDatePicker(this.props.language)}
                    shortcuts={this.props.config?.shortcuts?.map(({label, value, term}) => {
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
