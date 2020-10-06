import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get, set, isEmpty, findKey, orderBy, map} from 'lodash';

import {gettext} from 'core/utils';

import {InputArray, MultiTextInput, Input, Toggle, ToggleBox,
    ContactNumberInput, Label, SelectFieldSearchInput} from './index';
import {validateMinRequiredField, getContactTypeObject,
    getMinRequiredFieldLabels, getMinRequiredFieldLabel} from '../../../contacts/helpers';
import {IContact, IContactsService, IContactType} from '../../Contacts';

import {
    Row,
    RowItem,
    LineInput,
    SelectInput,
} from 'core/ui/components/Form';

interface IProps {
    svc: {
        metadata: {
            values: {
                regions: Array<any>;
                countries: Array<any>;
                contact_type: Array<IContactType>;
                contact_job_titles: Array<any>;
                contact_phone_usage: Array<any>;
                contact_mobile_usage: Array<any>;
            }
        };
        contacts: IContactsService;
        privileges: any;
    };
    contact: IContact;
    contactType: string;
    onChange(field: string, value: any, e?: any): void;
    readOnly: boolean;
    errors: {[key: string]: string};
}

interface IState {
    jobTitles?: any;
    stateNames?: any;
    countries?: any;
    phoneUsages?: any;
    mobileUsages?: any;
    displayOtherStateField?: any;
    requiredField?: any;
    touched?: any;
    organisations?: any;
    orgValue?: any;
    contactTypes?: Array<IContactType>;
    contactType?: IContactType;
}

export class ProfileDetail extends React.PureComponent<IProps, IState> {
    static propTypes: any;
    static defaultProps: any;

    constructor(props: IProps) {
        super(props);
        const {svc, contact} = props;
        const {metadata} = svc;

        let stateNames = [], countries = [], contactTypes = [];

        if (metadata.values.regions) {
            stateNames = orderBy(metadata.values.regions, 'name', 'asc');
        }

        if (metadata.values.countries) {
            countries = orderBy(metadata.values.countries, 'name', 'asc');
        }

        if (metadata.values.contact_type) {
            contactTypes = orderBy(metadata.values.contact_type, 'name', 'asc');
        }

        this.state = {
            jobTitles: orderBy(metadata.values.contact_job_titles, 'name', 'asc') || [],
            stateNames: stateNames,
            countries: countries,
            phoneUsages: metadata.values.contact_phone_usage || [],
            mobileUsages: metadata.values.contact_mobile_usage || [],
            displayOtherStateField: this.shouldDisplayOtherState(props) || false,
            requiredField: !validateMinRequiredField(contact) || false,
            touched: {},
            organisations: [],
            orgValue: (contact && contact.organisation) ? contact.organisation : '',
            contactTypes: contactTypes,
            contactType: null,
        };

        this.changeOtherStateField = this.changeOtherStateField.bind(this);
        this.onBlur = this.onBlur.bind(this);
        this.isFieldInvalid = this.isFieldInvalid.bind(this);
        this.getSearchResult = this.getSearchResult.bind(this);
        this.handleOrgChange = this.handleOrgChange.bind(this);
        this.onContactTypeChanged = this.onContactTypeChanged.bind(this);
    }

    componentDidMount(): void {
        if (this.props.contact && this.props.contact.contact_type) {
            this.setState({
                contactType: getContactTypeObject(
                    this.state.contactTypes,
                    this.props.contact.contact_type,
                ),
            });
        }
    }

    onBlur(e) {
        const _touched = this.state.touched;

        set(_touched, e.target.name, true);

        this.setState({touched: _touched});
    }

    isFieldInvalid(field) {
        return this.state.touched[field] && isEmpty(this.props.contact[field]);
    }

    changeOtherStateField(e) {
        this.setState({displayOtherStateField: e.target.checked});
    }

    shouldDisplayOtherState(props) {
        const {svc, contact} = props;
        const {metadata} = svc;

        return !isEmpty(contact.contact_state) &&
            !findKey(metadata.values.regions, (m) => m.qcode === contact.contact_state);
    }

    getSearchResult(field, text) {
        const {svc} = this.props;
        const {contacts} = svc;

        if (text) {
            contacts.queryField(field, text).then((items) => {
                switch (field) {
                case 'organisation':
                    this.setState({
                        organisations: map(items._items, field),
                        orgValue: text,
                    });
                }
            });
        }
    }

    handleOrgChange(field, value) {
        this.setState({
            orgValue: value,
        });
        this.props.onChange(field, value);
    }

    componentWillReceiveProps(nextProps: IProps) {
        if (nextProps.contact !== this.props.contact) {
            const displayOtherState = this.shouldDisplayOtherState(nextProps);
            const newState: IState = {
                displayOtherStateField: displayOtherState,
                requiredField: !validateMinRequiredField(nextProps.contact) || false,
                orgValue: get(nextProps.contact, 'organisation', ''),
            };

            if (nextProps.contact.contact_type !== this.props.contact.contact_type) {
                newState.contactType = getContactTypeObject(
                    this.state.contactTypes,
                    nextProps.contact.contact_type,
                );
            }

            this.setState(newState);
        }
    }

    onContactTypeChanged(field: string, value: IContactType) {
        this.props.onChange(
            'contact_type',
            (value && value.qcode) ? value.qcode : null,
        );
    }

    render() {
        const {contact, onChange, readOnly, errors, contactType} = this.props;

        const contactLabel = contactType === 'person' ? gettext('Role') : gettext('Point of contact');
        const isRequired = get(this.state, 'requiredField', false);
        const MSG_REQUIRED = gettext('This field is required.');
        const isAssignable = this.state.contactType && this.state.contactType.assignable;
        const minFieldMessage = gettext('At least one of [{{list}}] is required.', {list: getMinRequiredFieldLabels()});
        const showMinFieldsWarning = !validateMinRequiredField(contact) && !readOnly;

        return (
            <div className="details-info">

                {!readOnly && (
                    <div className="sd-alert__container">
                        <div className="sd-alert sd-alert--hollow">
                            <span className="alert-info-msg">
                                {gettext('Please specify \'first name, last name\' or  \'organisation\' or both, ' +
                                    'and at least one of [{{list}}] fields.', {list: getMinRequiredFieldLabels()})}
                            </span>
                        </div>
                    </div>
                )}

                <Row flex={true}>
                    {get(this.state, 'contactTypes.length', 0) > 0 && (
                        <RowItem>
                            <SelectInput
                                field="contactType"
                                label={gettext('Contact Type')}
                                value={this.state.contactType || {}}
                                onChange={this.onContactTypeChanged}
                                options={get(this.state, 'contactTypes', [])}
                                labelField="name"
                                keyField="qcode"
                                clearable={true}
                                readOnly={readOnly}
                            />
                        </RowItem>
                    )}
                    <RowItem noGrow={true}>
                        <LineInput readOnly={readOnly}>
                            <Label text={gettext('public')} />
                            <Toggle
                                value={get(contact, 'public', false)}
                                onChange={(e) => onChange('public', e.target.value)}
                                readOnly={readOnly}
                            />
                        </LineInput>
                    </RowItem>
                    <RowItem noGrow={true}>
                        <LineInput readOnly={readOnly}>
                            <Label text={gettext('Active')} />
                            <Toggle
                                value={get(contact, 'is_active', false)}
                                onChange={(e) => onChange('is_active', e.target.value)}
                                readOnly={readOnly}
                            />
                        </LineInput>
                    </RowItem>
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
                            autoFocus={true}
                        />
                    </LineInput>
                </Row>

                <Row>
                    <LineInput
                        required={contactType === 'person'}
                        invalid={contactType === 'person' && this.isFieldInvalid('first_name')}
                        message={contactType === 'person' && this.isFieldInvalid('first_name') ?
                            MSG_REQUIRED : ''}
                        readOnly={readOnly}
                    >
                        <Label text={gettext('first name')} />
                        <Input
                            field="first_name"
                            value={get(contact, 'first_name', '')}
                            onChange={onChange}
                            onBlur={this.onBlur}
                            type="text"
                            readOnly={readOnly}
                            required={true}
                        />
                    </LineInput>
                </Row>

                <Row>
                    <LineInput
                        readOnly={readOnly}
                        required={contactType === 'person'}
                        invalid={contactType === 'person' && this.isFieldInvalid('last_name')}
                        message={contactType === 'person' && this.isFieldInvalid('last_name') ?
                            MSG_REQUIRED : ''}
                    >
                        <Label text={gettext('last name')} />
                        <Input
                            field="last_name"
                            value={get(contact, 'last_name', '')}
                            onChange={onChange}
                            onBlur={this.onBlur}
                            type="text"
                            readOnly={readOnly}
                        />
                    </LineInput>
                </Row>

                {contactType === 'organisation' && (
                    <Row>
                        <LineInput
                            readOnly={readOnly}
                            required={contactType === 'organisation'}
                            invalid={contactType === 'organisation' && this.isFieldInvalid('organisation')}
                            message={
                                (contactType === 'organisation' && this.isFieldInvalid('organisation'))
                                    ? MSG_REQUIRED
                                    : ''
                            }
                        >
                            <Label text={gettext('organisation')} />
                            <Input
                                field="organisation"
                                value={get(contact, 'organisation', '')}
                                onChange={onChange}
                                onBlur={this.onBlur}
                                type="text"
                                readOnly={readOnly}
                            />
                        </LineInput>
                    </Row>
                )}

                {contactType === 'person' && (
                    <Row>
                        <SelectFieldSearchInput
                            field="organisation"
                            label={gettext('Organisation')}
                            value={this.state.orgValue}
                            onChange={this.handleOrgChange}
                            querySearch={true}
                            onQuerySearch={((text) => this.getSearchResult('organisation', text))}
                            dataList={this.state.organisations}
                            readOnly={readOnly}
                        />
                    </Row>
                )}

                <Row>
                    <LineInput readOnly={readOnly}>
                        <Label text={contactLabel} />
                        <Input
                            field="job_title"
                            onChange={onChange}
                            value={get(contact, 'job_title', '')}
                            onBlur={this.onBlur}
                            type="text"
                            readOnly={readOnly}
                        />
                    </LineInput>
                </Row>

                <Row>
                    <LineInput
                        readOnly={readOnly}
                        required={isRequired || isAssignable}
                        invalid={!!get(errors, 'contact_email') || showMinFieldsWarning}
                    >
                        <Label text={getMinRequiredFieldLabel('contact_email')} />
                        {get(errors, 'contact_email') && (
                            <div className="sd-line-input__message">
                                {get(errors, 'contact_email')}
                            </div>
                        )}
                        {showMinFieldsWarning && !get(errors, 'contact_email') && (
                            <div className="sd-line-input__message">
                                {minFieldMessage}
                            </div>
                        )}
                        <InputArray
                            field="contact_email"
                            type="email"
                            value={get(contact, 'contact_email', [])}
                            onChange={onChange}
                            component={MultiTextInput}
                            defaultValue=""
                            errors={errors}
                            readOnly={readOnly}
                        />
                    </LineInput>
                </Row>

                <Row>
                    <LineInput readOnly={readOnly} required={isRequired} invalid={showMinFieldsWarning}>
                        <Label text={getMinRequiredFieldLabel('contact_phone')} />
                        {showMinFieldsWarning && (
                            <div className="sd-line-input__message">
                                {minFieldMessage}
                            </div>
                        )}
                        <InputArray
                            field="contact_phone"
                            value={get(contact, 'contact_phone', [])}
                            onChange={onChange}
                            component={ContactNumberInput}
                            usages={get(this.state, 'phoneUsages', [])}
                            defaultValue={{number: '', usage: '', public: true}}
                            readOnly={readOnly}
                        />
                    </LineInput>
                </Row>

                <ToggleBox title={gettext('MORE')} isOpen={false} style="toggle-box--circle" scrollInView={true}>

                    <Row>
                        <LineInput readOnly={readOnly} required={isRequired} invalid={showMinFieldsWarning}>
                            <Label text={getMinRequiredFieldLabel('mobile')} />
                            {showMinFieldsWarning && (
                                <div className="sd-line-input__message">
                                    {minFieldMessage}
                                </div>
                            )}
                            <InputArray
                                field="mobile"
                                value={get(contact, 'mobile', [])}
                                onChange={onChange}
                                component={ContactNumberInput}
                                usages={get(this.state, 'mobileUsages', [])}
                                defaultValue={{number: '', usage: '', public: true}}
                                readOnly={readOnly}
                            />
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
                                readOnly={readOnly}
                            />
                        </LineInput>
                    </Row>

                    <Row>
                        <LineInput readOnly={readOnly} hint={gettext('e.g. http://www.website.com')}>
                            <Label text={gettext('website')} />
                            <Input
                                field="website"
                                value={get(contact, 'website', '')}
                                onChange={onChange}
                                type="text"
                                readOnly={readOnly}
                            />
                        </LineInput>
                    </Row>

                    <Row>
                        <LineInput
                            readOnly={readOnly}
                            required={isRequired}
                            hint={gettext('e.g. @cityofsydney')}
                            invalid={!isEmpty(errors.twitter) || showMinFieldsWarning}
                            message={get(errors, 'twitter', '')}
                        >
                            <Label text={getMinRequiredFieldLabel('twitter')} />
                            {showMinFieldsWarning && isEmpty(errors.twitter) && (
                                <div className="sd-line-input__message">
                                    {minFieldMessage}
                                </div>
                            )}
                            <Input
                                field="twitter"
                                value={get(contact, 'twitter', '')}
                                onChange={onChange}
                                type="text"
                                readOnly={readOnly}
                                placeholder="@username"
                            />
                        </LineInput>
                    </Row>

                    <Row>
                        <LineInput
                            readOnly={readOnly}
                            required={isRequired}
                            invalid={showMinFieldsWarning}
                            hint={gettext('e.g. cityofsydney from https://www.facebook.com/cityofsydney')}
                        >
                            <Label text={getMinRequiredFieldLabel('facebook')} />
                            {showMinFieldsWarning && (
                                <div className="sd-line-input__message">
                                    {minFieldMessage}
                                </div>
                            )}
                            <Input
                                field="facebook"
                                value={get(contact, 'facebook', '')}
                                onChange={onChange}
                                type="text"
                                readOnly={readOnly}
                                placeholder="username"
                            />
                        </LineInput>
                    </Row>

                    <Row>
                        <LineInput
                            readOnly={readOnly}
                            required={isRequired}
                            invalid={showMinFieldsWarning}
                            hint={gettext('e.g. cityofsydney from https://www.instagram.com/cityofsydney')}
                        >
                            <Label text={getMinRequiredFieldLabel('instagram')} />
                            {showMinFieldsWarning && (
                                <div className="sd-line-input__message">
                                    {minFieldMessage}
                                </div>
                            )}
                            <Input
                                field="instagram"
                                value={get(contact, 'instagram', '')}
                                onChange={onChange}
                                type="text"
                                readOnly={readOnly}
                                placeholder="username"
                            />
                        </LineInput>
                    </Row>

                    <Row noPadding={true}>
                        <LineInput readOnly={readOnly} hint={gettext('Street Address, PO Box, Company Name')}>
                            <Label text={gettext('Street Address')} />
                            <Input
                                field="contact_address[0]"
                                value={get(contact, 'contact_address[0]', '')}
                                onChange={onChange}
                                type="text"
                                readOnly={readOnly}
                                placeholder={gettext('Address line 1')}
                            />
                        </LineInput>
                    </Row>
                    <Row>
                        <LineInput readOnly={readOnly} hint={gettext('Building, Suite, Unit, Apartment, Floor, etc.')} >
                            <Input
                                field="contact_address[1]"
                                value={get(contact, 'contact_address[1]', '')}
                                onChange={onChange}
                                type="text"
                                readOnly={readOnly}
                                placeholder={gettext('Address line 2')}
                            />
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
                                readOnly={readOnly}
                            />
                        </LineInput>
                        <LineInput>
                            <Label text={gettext('postcode')} />
                            <Input
                                field="postcode"
                                value={get(contact, 'postcode', '')}
                                onChange={onChange}
                                type="text"
                                readOnly={readOnly}
                            />
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
                                readOnly={readOnly}
                            />
                        </LineInput>
                    </Row>

                    <Row flex={true}>
                        {!this.state.displayOtherStateField && (
                            <SelectInput
                                field="contact_state"
                                label={gettext('State/Province or Region')}
                                value={get(contact, 'contact_state', {})}
                                onChange={onChange}
                                options={get(this.state, 'stateNames', [])}
                                labelField="name"
                                keyField="qcode"
                                clearable={true}
                            />
                        )
                        }

                        {this.state.displayOtherStateField && (
                            <LineInput readOnly={readOnly}>
                                <Label text={gettext('State/Province or Region')} />
                                <Input
                                    field="contact_state"
                                    value={get(contact, 'contact_state', '')}
                                    onChange={onChange}
                                    type="text"
                                    placeholder="State/Province or Region"
                                    readOnly={readOnly}
                                />
                            </LineInput>
                        )}

                        <LineInput readOnly={readOnly}>
                            <Label text={gettext('other')} />
                            <input
                                checked={get(this.state, 'displayOtherStateField', false)}
                                onChange={this.changeOtherStateField}
                                type="checkbox"
                            />
                        </LineInput>
                    </Row>

                    <Row>
                        <SelectInput
                            label={gettext('Country')}
                            field="country"
                            value={get(contact, 'country', {})}
                            onChange={onChange}
                            type="text"
                            readOnly={readOnly}
                            options={get(this.state, 'countries')}
                            keyField="qcode"
                            labelField="name"
                            clearable
                        />
                    </Row>

                    <Row>
                        <LineInput readOnly={readOnly}>
                            <Label text={gettext('notes')} />
                            <textarea
                                className={classNames(
                                    'sd-line-input__input',
                                    {'sd-line-input__input--add-min-height': !isEmpty(contact.notes)},
                                )}
                                name="notes"
                                value={get(contact, 'notes', '')}
                                onChange={(e) => onChange('notes', e.target.value)}
                                readOnly={readOnly}
                            />
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
    readOnly: PropTypes.bool,
    errors: PropTypes.object,
};
