import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {Row, LineInput, InputArray, MultiTextInput, Input, SelectInput, Toggle, ToggleBox,
    ContactNumberInput, Label} from './index';
import {get, set, isEmpty, findKey, orderBy} from 'lodash';
import {MSG_REQUIRED} from '../../../contacts/constants';
import {validateMinRequiredField} from '../../../contacts/helpers';


export class ProfileDetail extends React.Component {
    constructor(props) {
        super(props);
        const {svc, contact} = props;
        const {metadata} = svc;

        let stateNames = [];

        if (metadata.values.contact_states) {
            stateNames = orderBy(metadata.values.contact_states, 'name', 'asc');
        }

        this.state = {
            jobTitles: metadata.values.contact_job_titles || [],
            stateNames: stateNames || [],
            phoneUsages: metadata.values.contact_phone_usage || [],
            mobileUsages: metadata.values.contact_mobile_usage || [],
            displayOtherStateField: this.shouldDisplayOtherState(props) || false,
            requiredField: !validateMinRequiredField(contact) || false,
            touched: {},
        };

        this.changeOtherStateField = this.changeOtherStateField.bind(this);
        this.onBlur = this.onBlur.bind(this);
        this.isFieldInvalid = this.isFieldInvalid.bind(this);
    }

    onBlur(e) {
        let _touched = this.state.touched;

        set(_touched, e.target.name, true);

        this.setState({touched: _touched});
    }

    isFieldInvalid(field) {
        return this.state.touched[field] && _.isEmpty(this.props.contact[field]);
    }

    changeOtherStateField(e) {
        this.setState({displayOtherStateField: e.target.checked});
    }

    shouldDisplayOtherState(props) {
        const {svc, contact} = props;
        const {metadata} = svc;

        return !isEmpty(contact.contact_state) &&
            !findKey(metadata.values.contact_states, (m) => m.qcode === contact.contact_state);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.contact !== this.props.contact) {
            let displayOtherState = this.shouldDisplayOtherState(nextProps);

            this.setState({
                displayOtherStateField: displayOtherState,
                requiredField: !validateMinRequiredField(nextProps.contact) || false,
            });
        }
    }

    render() {
        const {svc, contact, onChange, readOnly, errors, contactType, onChangeContactType} = this.props;
        const {gettext} = svc;

        const alertInfo = (contact) => contactType === 'person' ? '\'first name, last name\'' : '\'organisation\'';

        let isRequired = get(this.state, 'requiredField', false);

        return (
            <div className="details-info">

                {!readOnly &&
                    <div className="sd-alert__container">
                        <div className="sd-alert sd-alert--hollow">
                            <span className="alert-info-msg">
                                {gettext(`At minimum ${alertInfo(contact)} and at least one of
                                 [mobile, phone, email, twitter, facebook, instagram] fields are required.`)}
                            </span>
                        </div>
                    </div>
                }

                {!readOnly &&
                    <Row>
                        <LineInput readOnly={readOnly} className="sd-line-input__toggle">
                            <Label text={gettext('public')} />
                            <Toggle
                                value={get(contact, 'public', false)}
                                onChange={(e) => onChange('public', e.target.value)}
                                readOnly={readOnly} />
                        </LineInput>
                    </Row>
                }

                <Row>
                    <LineInput isSelect={true} readOnly={readOnly}>
                        <Label text={gettext('Type')} />
                        <select className="sd-line-input__select"
                            value={contactType}
                            onChange={onChangeContactType}
                            disabled={readOnly || contact._id}
                        >
                            <option value="person">Person</option>
                            <option value="organisation">Organisation</option>
                        </select>
                    </LineInput>
                </Row>

                <Row>
                    <LineInput readOnly={readOnly} hint={gettext('e.g. professor, commissioner')}>
                        <Label text={gettext('honorific')} />
                        <Input
                            field="honorific"
                            value={get(contact, 'honorific', '')}
                            onChange={onChange}
                            type="text"
                            readOnly={readOnly}
                            autoFocus={true} />
                    </LineInput>
                </Row>

                {contactType === 'person' &&
                    <Row>
                        <LineInput
                            required={true}
                            invalid={this.isFieldInvalid('first_name')}
                            message={this.isFieldInvalid('first_name') ? gettext(MSG_REQUIRED) : ''}
                            readOnly={readOnly}>
                            <Label text={gettext('first name')} />
                            <Input
                                field="first_name"
                                value={get(contact, 'first_name', '')}
                                onChange={onChange}
                                onBlur={this.onBlur}
                                type="text"
                                readOnly={readOnly}
                                required={true} />
                        </LineInput>
                    </Row>
                }

                {contactType === 'person' &&
                    <Row>
                        <LineInput
                            readOnly={readOnly}
                            required={true}
                            invalid={this.isFieldInvalid('last_name')}
                            message={this.isFieldInvalid('last_name') ? gettext(MSG_REQUIRED) : ''}>
                            <Label text={gettext('last name')} />
                            <Input
                                field="last_name"
                                value={get(contact, 'last_name', '')}
                                onChange={onChange}
                                onBlur={this.onBlur}
                                type="text"
                                readOnly={readOnly} />
                        </LineInput>
                    </Row>
                }

                <Row>
                    <LineInput
                        readOnly={readOnly}
                        required={contactType === 'organisation'}
                        invalid={contactType === 'organisation' && this.isFieldInvalid('organisation')}
                        message={(contactType === 'organisation' && this.isFieldInvalid('organisation')) ?
                            MSG_REQUIRED : ''}>
                        <Label text={gettext('organisation')} />
                        <Input
                            field="organisation"
                            value={get(contact, 'organisation', '')}
                            onChange={onChange}
                            onBlur={this.onBlur}
                            type="text"
                            readOnly={readOnly} />
                    </LineInput>
                </Row>

                <Row>
                    <SelectInput
                        field="job_title"
                        label="Job title"
                        value={get(contact, 'job_title', '')}
                        onChange={onChange}
                        options={get(this.state, 'jobTitles', [])}
                        labelField="name"
                        keyField="name"
                        clearable={true} />
                </Row>

                <Row>
                    <LineInput readOnly={readOnly} required={isRequired}>
                        <Label text={gettext('email')} />
                        <InputArray
                            field="contact_email"
                            type="email"
                            value={get(contact, 'contact_email', [])}
                            onChange={onChange}
                            component={MultiTextInput}
                            defaultValue=""
                            errors={errors}
                            readOnly={readOnly} />
                    </LineInput>
                </Row>

                <Row>
                    <LineInput readOnly={readOnly} required={isRequired}>
                        <Label text={gettext('phone')} />
                        <InputArray
                            field="contact_phone"
                            value={get(contact, 'contact_phone', [])}
                            onChange={onChange}
                            component={ContactNumberInput}
                            usages={get(this.state, 'phoneUsages', [])}
                            defaultValue={{number: '', usage: '', public: true}}
                            readOnly={readOnly} />
                    </LineInput>
                </Row>

                <ToggleBox title={gettext('MORE')} isOpen={false} style="toggle-box--circle" scrollInView={true}>

                    <Row>
                        <LineInput readOnly={readOnly} required={isRequired}>
                            <Label text={gettext('mobile')} />
                            <InputArray
                                field="mobile"
                                value={get(contact, 'mobile', [])}
                                onChange={onChange}
                                component={ContactNumberInput}
                                usages={get(this.state, 'mobileUsages', [])}
                                defaultValue={{number: '', usage: '', public: true}}
                                readOnly={readOnly} />
                        </LineInput>
                    </Row>

                    <Row>
                        <LineInput readOnly={readOnly}>
                            <Label text={gettext('fax')} />
                            <Input
                                field="fax"
                                value={get(contact, 'fax', '')}
                                onChange={onChange}
                                type="text"
                                readOnly={readOnly} />
                        </LineInput>
                    </Row>

                    <Row>
                        <LineInput readOnly={readOnly}>
                            <Label text={gettext('website')} />
                            <Input
                                field="website"
                                value={get(contact, 'website', '')}
                                onChange={onChange}
                                type="text"
                                readOnly={readOnly} />
                        </LineInput>
                    </Row>

                    <Row>
                        <LineInput readOnly={readOnly} required={isRequired} hint={gettext('e.g. @cityofsydney')}
                            invalid={!isEmpty(errors.twitter)} message={get(errors, 'twitter', '')}>
                            <Label text={gettext('twitter')} />
                            <Input
                                field="twitter"
                                value={get(contact, 'twitter', '')}
                                onChange={onChange}
                                type="text"
                                readOnly={readOnly}
                                placeholder="@username" />
                        </LineInput>
                    </Row>

                    <Row>
                        <LineInput readOnly={readOnly} required={isRequired}
                            hint={gettext('e.g. cityofsydney from https://www.facebook.com/cityofsydney')}>
                            <Label text={gettext('facebook')} />
                            <Input
                                field="facebook"
                                value={get(contact, 'facebook', '')}
                                onChange={onChange}
                                type="text"
                                readOnly={readOnly}
                                placeholder="username" />
                        </LineInput>
                    </Row>

                    <Row>
                        <LineInput readOnly={readOnly} required={isRequired}
                            hint={gettext('e.g. cityofsydney from https://www.instagram.com/cityofsydney')}>
                            <Label text={gettext('instagram')} />
                            <Input
                                field="instagram"
                                value={get(contact, 'instagram', '')}
                                onChange={onChange}
                                type="text"
                                readOnly={readOnly}
                                placeholder="username" />
                        </LineInput>
                    </Row>

                    <Row>
                        <LineInput readOnly={readOnly}>
                            <Label text={gettext('address')} />
                            <InputArray
                                field="contact_address"
                                value={get(contact, 'contact_address', [])}
                                onChange={onChange}
                                component={MultiTextInput}
                                defaultValue=""
                                errors={errors}
                                readOnly={readOnly} />
                        </LineInput>
                    </Row>

                    <Row flex={true}>
                        <LineInput readOnly={readOnly} hint={gettext('e.g. Rhodes, CBD')}>
                            <Label text={gettext('locality')} />
                            <Input
                                field="locality"
                                value={get(contact, 'locality', '')}
                                onChange={onChange}
                                type="text"
                                readOnly={readOnly} />
                        </LineInput>
                        <LineInput>
                            <Label text={gettext('postcode')} />
                            <Input
                                field="postcode"
                                value={get(contact, 'postcode', '')}
                                onChange={onChange}
                                type="text"
                                readOnly={readOnly} />
                        </LineInput>
                    </Row>

                    <Row>
                        <LineInput readOnly={readOnly}>
                            <Label text={gettext('city')} />
                            <Input
                                field="city"
                                value={get(contact, 'city', '')}
                                onChange={onChange}
                                type="text"
                                readOnly={readOnly} />
                        </LineInput>
                    </Row>

                    <Row flex={true}>
                        {!this.state.displayOtherStateField && <SelectInput
                            field="contact_state"
                            label={gettext('State/Province or Region')}
                            value={get(contact, 'contact_state', '')}
                            onChange={onChange}
                            options={get(this.state, 'stateNames', [])}
                            labelField="name"
                            keyField="qcode"
                            clearable={true} />
                        }

                        {this.state.displayOtherStateField && <LineInput readOnly={readOnly}>
                            <Label text={gettext('State/Province or Region')} />
                            <Input
                                field="contact_state"
                                value={get(contact, 'contact_state', '')}
                                onChange={onChange}
                                type="text"
                                placeholder="State/Province or Region"
                                readOnly={readOnly} />
                        </LineInput>}

                        <LineInput readOnly={readOnly}>
                            <Label text={gettext('other')} />
                            <input
                                checked={get(this.state, 'displayOtherStateField', false)}
                                onChange={this.changeOtherStateField}
                                type="checkbox" />
                        </LineInput>
                    </Row>

                    <Row>
                        <LineInput readOnly={readOnly}>
                            <Label text={gettext('country')} />
                            <Input
                                field="country"
                                value={get(contact, 'country', '')}
                                onChange={onChange}
                                type="text"
                                readOnly={readOnly} />
                        </LineInput>
                    </Row>

                    <Row>
                        <LineInput readOnly={readOnly}>
                            <Label text={gettext('notes')} />
                            <textarea
                                className={classNames(
                                    'sd-line-input__input',
                                    {'sd-line-input__input--add-min-height': !isEmpty(contact.notes)}
                                )}
                                name="notes"
                                value={get(contact, 'notes', '')}
                                onChange={(e) => onChange('notes', e.target.value)}
                                readOnly={readOnly} />
                        </LineInput>
                    </Row>

                </ToggleBox>

            </div>
        );
    }
}

ProfileDetail.propTypes = {
    svc: PropTypes.object.isRequired,
    contact: PropTypes.object.isRequired,
    contactType: PropTypes.string,
    onChange: PropTypes.func,
    onChangeContactType: PropTypes.func,
    readOnly: PropTypes.bool,
    errors: PropTypes.object,
};
