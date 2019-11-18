import React from 'react';
import PropTypes from 'prop-types';
import {get, set, isEqual, cloneDeep, some, isEmpty, extend, each, omit, isNil} from 'lodash';

import {gettext} from 'core/utils';
import {StretchBar} from 'core/ui/components/SubNav';

import {validateRequiredFormFields, getContactType, validateAssignableType} from '../../helpers';
import {FB_URL, IG_URL} from '../../constants';
import {ProfileDetail} from './ProfileDetail';
import {IContact, IContactsService} from '../../Contacts';

interface IProps {
    svc: {
        contacts: IContactsService;
        notify: any;
        privileges: any;
        metadata: any;
    };
    contact: IContact;
    onSave(result: IContact): void;
    onCancel(): void;
    onDirty(): void;
    onValidation(valid: boolean): void;
    triggerSave: boolean;
    hideActionBar: boolean;
}

interface IState {
    currentContact: IContact;
    errors: {[key: string]: string};
    originalContact: IContact;
    dirty: boolean;
    isFormValid: boolean;
}

export class ContactFormContainer extends React.PureComponent<IProps, IState> {
    static propTypes: any;
    static defaultProps: any;

    constructor(props) {
        super(props);

        // Initialize
        this.state = {
            currentContact: props.contact || {},
            errors: {},
            originalContact: props.contact || {},
            dirty: false,
            isFormValid: false,
        };

        this.save = this.save.bind(this);
        this.onChange = this.onChange.bind(this);
        this.validateForm = this.validateForm.bind(this);
    }

    validateForm() {
        const valid = validateRequiredFormFields(this.state.currentContact) &&
            !some(this.state.errors, (value) => !isEmpty(value));

        this.setState({isFormValid: valid});

        if (this.state.dirty && this.props.onDirty) {
            this.props.onDirty();
        }

        if (this.props.onValidation) {
            this.props.onValidation(valid);
        }
    }

    validateField(fieldName, value, e, diff) {
        const fieldValidationErrors = this.state.errors;

        const {contacts} = this.props.svc;
        const twitterPattern = contacts.twitterPattern;

        if (e && e.target.type === 'email') {
            if (e.target.validity.typeMismatch) {
                fieldValidationErrors[e.target.name] = gettext('Please provide a valid email address');
            } else {
                fieldValidationErrors[e.target.name] = '';
            }
        }

        switch (fieldName) {
        case 'twitter':
            fieldValidationErrors[fieldName] = value.match(twitterPattern) || isEmpty(value) ? '' :
                gettext('Please provide a valid twitter account');
            break;
        default:
            break;
        }

        if (!validateAssignableType(diff)) {
            fieldValidationErrors.contact_email = gettext(
                'Contact type "{{ contact_type }}" MUST have an email',
                {contact_type: get(diff, 'contact_type.name')},
            );
        } else if (get(fieldValidationErrors, 'contact_email')) {
            delete fieldValidationErrors.contact_email;
        }

        return fieldValidationErrors;
    }

    componentWillReceiveProps(nextProps) {
        if (!this.props.triggerSave && nextProps.triggerSave) {
            this.save();
        }
    }

    save() {
        const {svc} = this.props;
        const {notify, contacts} = svc;

        const origContact = this.state.originalContact;

        notify.info(gettext('Saving...'));

        let diff: any = {};

        each(this.state.currentContact, (value, key) => {
            if (!isEqual(origContact[key], value)) {
                extend(diff, {[key]: value});
            }
        });

        if (diff.facebook) {
            diff.facebook = FB_URL + this.state.currentContact.facebook;
        }

        if (diff.instagram) {
            diff.instagram = IG_URL + this.state.currentContact.instagram;
        }

        // clean diff
        diff = omit(diff, 'type');

        return contacts.save(origContact, diff)
            .then((result: IContact) => {
                notify.pop();
                notify.success(gettext('contact saved.'));

                this.setState({
                    originalContact: result,
                    currentContact: result,
                    dirty: false,
                }, () => {
                    if (this.props.onSave) {
                        this.props.onSave(result);
                    }
                });
            }, (response) => {
                notify.pop();

                let errorMessage = gettext('There was an error when saving the contact.');

                if (response.data && response.data._issues) {
                    if (!isNil(response.data._issues['validator exception'])) {
                        errorMessage = gettext('Error: ' + response.data._issues['validator exception']);
                    }
                }

                notify.error(errorMessage);
            });
    }

    onChange(field, value, e) {
        const diff = cloneDeep(this.state.currentContact);

        const origContact = this.state.originalContact;

        set(diff, field, value);

        this.setState({
            currentContact: diff,
            dirty: !isEqual(origContact, diff),
            errors: this.validateField(field, value, e, diff),
        }, this.validateForm);
    }

    render() {
        const {svc, contact, onCancel, hideActionBar} = this.props;
        const {
            isFormValid = false,
            dirty = false,
            errors = {},
        } = this.state;
        const {privileges} = svc;

        const readOnly = !get(privileges, 'privileges.contacts', false);
        const currentContact: IContact = this.state.currentContact || null;
        const contactType: string = getContactType(currentContact) || 'person';
        const iconName = contactType === 'organisation' ?
            'icon-business' :
            'icon-user';

        return (
            <div id={contact._id} key={contact._id} className="contact-form">
                <form name="contactForm"
                    className="side-panel side-panel--shadow-right"
                    onSubmit={(e) => e.preventDefault()}
                >
                    {!hideActionBar && (
                        <div className="subnav subnav--darker">
                            <StretchBar>
                                <div className="contact__type-icon"
                                    data-sd-tooltip="Organisation Contact"
                                    data-flow="right"
                                >
                                    <i className={iconName} />
                                </div>
                            </StretchBar>
                            <StretchBar right={true}>
                                <button className="btn" onClick={onCancel}>
                                    {gettext('Cancel')}
                                </button>
                                {!readOnly && (
                                    <button
                                        className="btn btn--primary"
                                        onClick={this.save}
                                        disabled={!isFormValid || !dirty}
                                    >{gettext('Save')}</button>
                                )}
                            </StretchBar>
                        </div>
                    )}
                    <div className="profile-info">
                        <ProfileDetail
                            contact={currentContact}
                            svc={svc}
                            onChange={this.onChange}
                            readOnly={readOnly}
                            errors={errors}
                            contactType={contactType}
                        />
                    </div>
                </form>
            </div>
        );
    }
}

ContactFormContainer.propTypes = {
    svc: PropTypes.object.isRequired,
    contact: PropTypes.object.isRequired,
    onSave: PropTypes.func,
    onCancel: PropTypes.func,
    onDirty: PropTypes.func,
    onValidation: PropTypes.func,
    triggerSave: PropTypes.bool,
    hideActionBar: PropTypes.bool,
};

ContactFormContainer.defaultProps = {hideActionBar: false};
