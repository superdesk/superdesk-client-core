import React from 'react';
import PropTypes from 'prop-types';
import * as momentAlias from 'moment';
import {Popup, Content, Header, Footer} from '../../Popup';
import {Button} from '../../';
import {DayPicker} from './DayPicker';
import {MonthPicker} from './MonthPicker';
import {YearPicker} from './YearPicker';

const moment:any = momentAlias;

import {gettext} from '../../utils';

import './style.scss';

/**
 * @ngdoc react
 * @name DateInputPopup
 * @description Main Popup Component of DatePicker
 */
export class DateInputPopup extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    
    
 
    
    

    constructor(props) {
        super(props);
        const currentDate = moment();

        this.state = {
            mode: 'day',
            modeTitle: this.getModeTitle(currentDate, 'day'),
            currentDate: currentDate,
            selectedDate: currentDate,
        };

        this.handleModeChange = this.handleModeChange.bind(this);
        this.handleSelectChange = this.handleSelectChange.bind(this);
    }

    componentWillMount() {
        const {value} = this.props;

        if (value && moment.isMoment(value)) {
            this.setState({
                mode: 'day',
                modeTitle: this.getModeTitle(value, 'day'),
                selectedDate: value.clone(),
            });
        }
    }

    /**
    * @ngdoc method
    * @name DateInputPopup#handleModeChange
    * @description handleModeChange changes selection mode from days-months-years
    */
    handleModeChange() {
        const maxMode = this.props.maxMode || 'year';

        if (this.state.mode === 'day' && maxMode !== 'month') {
            this.setState({
                mode: 'month',
                modeTitle: this.getModeTitle(this.state.selectedDate, 'month'),
            });
        } else if (this.state.mode === 'month') {
            this.setState({
                mode: 'year',
                modeTitle: this.getModeTitle(this.state.selectedDate, 'year'),
            });
        }
    }

    /**
    * @ngdoc method
    * @name DateInputPopup#getFurtherValues
    * @description getFurtherValues gets next set-list of options when left/right arrows are clicked
    */
    getFurtherValues(direction) {
        let diff = 1, diffType = '';

        switch (this.state.mode) {
        case 'day':
            // Have to change the month to previous value
            diffType = 'months';
            break;
        case 'month':
            // Have to change the year to previous value
            diffType = 'years';
            break;
        case 'year':
            diff = 20;
            diffType = 'years';
            break;
        }

        const newDate = direction ?
            this.state.selectedDate.clone().add(diff, diffType) :
            this.state.selectedDate.clone().subtract(diff, diffType);

        this.setState({
            modeTitle: this.getModeTitle(newDate, this.state.mode),
            selectedDate: newDate,
        });
    }

    handleConfirm(toolSelect /* 0-Today, 1-Tomorrow, 2-In two days*/) {
        const {onChange, close} = this.props;
        const {currentDate} = this.state;

        switch (toolSelect) {
        case 0:
            onChange(currentDate);
            break;
        case 1:
            onChange(currentDate.clone().add(1, 'days'));
            break;
        case 2:
            onChange(currentDate.clone().add(2, 'days'));
            break;
        }

        close();
    }

    /**
    * @ngdoc method
    * @name DateInputPopup#getStartingYearForYearPicker
    * @description getStartingYearForYearPicker returns starting year option in Year-picker
    */
    getStartingYearForYearPicker(date) {
        const yearRange = this.props.yearRange || 20;

        return parseInt(`${(date.year() - 1) / yearRange}`, 10) * yearRange + 1;
    }

    getModeTitle(date, mode) {
        const yearRange = this.props.yearRange || 20;

        switch (mode) {
        case 'day': return date.format('MMMM YYYY');
        case 'month': return date.format('YYYY');
        case 'year':
            return this.getStartingYearForYearPicker(date) + '-' +
                (this.getStartingYearForYearPicker(date) + yearRange - 1);
        }
    }

    /**
    * @ngdoc method
    * @name DateInputPopup#handleSelectChange
    * @description handleSelectChange changes mode from days-months-year
    */
    handleSelectChange(newDate) {
        let nextMode = '';

        switch (this.state.mode) {
        case 'month':
            nextMode = 'day';
            break;
        case 'year':
            nextMode = 'month';
            break;
        }

        if (this.state.mode === 'day') {
            this.props.onChange(newDate);
            this.props.close();
        } else {
            this.setState({
                selectedDate: newDate,
                mode: nextMode,
                modeTitle: this.getModeTitle(newDate, nextMode),
            });
        }
    }

    render() {
        return (
            <Popup
                close={this.props.close}
                target={this.props.target}
                noPadding={true}
                popupContainer={this.props.popupContainer}
                className="date-popup"
            >
                <Header noBorder={true} className="date-popup__header">
                    <div className="date-popup__header-row">
                        <Button
                            onClick={this.handleConfirm.bind(this, 0)}
                            text={gettext('Today')}
                        />
                        <Button
                            onClick={this.handleConfirm.bind(this, 1)}
                            text={gettext('Tomorrow')}
                        />
                        <Button
                            onClick={this.handleConfirm.bind(this, 2)}
                            text={gettext('In 2 days')}
                        />
                    </div>
                    <div className="date-popup__header-row date-popup__header-row--tools">
                        <Button
                            color="default"
                            icon="icon-chevron-left-thin"
                            onClick={this.getFurtherValues.bind(this, 0)}
                        />
                        <Button
                            color="default"
                            className="btn--mode"
                            aria-live="assertive"
                            aria-atomic="true"
                            onClick={this.handleModeChange}
                        >
                            <strong>{this.state.modeTitle}</strong>
                        </Button>
                        <Button
                            color="default"
                            icon="icon-chevron-right-thin"
                            onClick={this.getFurtherValues.bind(this, 1)}
                        />
                    </div>
                </Header>
                <Content>
                    <div className="date-popup__content">
                        { this.state.mode === 'day' && (
                            <DayPicker
                                selectedDate={this.state.selectedDate}
                                onChange={this.handleSelectChange} />
                        )}
                        { this.state.mode === 'month' && (
                            <MonthPicker
                                selectedDate={this.state.selectedDate}
                                onChange={this.handleSelectChange} />
                        )}
                        { this.state.mode === 'year' && (
                            <YearPicker
                                startingYear={this.getStartingYearForYearPicker(this.state.selectedDate)}
                                selectedDate={this.state.selectedDate} onChange={this.handleSelectChange} />
                        )}
                    </div>
                </Content>
                <Footer>
                    <Button
                        size="small"
                        pullRight={true}
                        onClick={this.props.close}
                        text={gettext('Cancel')}
                    />
                </Footer>
            </Popup>
        );
    }
}

DateInputPopup.propTypes = {
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.instanceOf(moment),
    ]),
    onChange: PropTypes.func.isRequired,
    close: PropTypes.func.isRequired,
    target: PropTypes.string.isRequired,
    maxMode: PropTypes.string,
    yearRange: PropTypes.number,
    popupContainer: PropTypes.func,
};
