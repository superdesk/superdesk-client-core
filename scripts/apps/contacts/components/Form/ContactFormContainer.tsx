import React from 'react';
import PropTypes from 'prop-types';
import {validateRequiredFormFields, replaceUrls} from '../../../contacts/helpers';
import {FB_URL, IG_URL} from '../../../contacts/constants';
import {ContactProfile} from './ContactProfile';
import {ActionBar} from './ActionBar';
import {get, set, isEqual, cloneDeep, some, isEmpty, extend, each, omit, isNil} from 'lodash';

export class ContactFormContainer extends React.Component<any, any> {
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

        if (this.state.dirty) {
            this.props.onDirty();
        }

        this.props.onValidation(valid);
    }

    validateField(fieldName, value, e) {
        const fieldValidationErrors = this.state.errors;

        const {gettext, contacts} = this.props.svc;
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

        return fieldValidationErrors;
    }

    componentWillReceiveProps(nextProps) {
        if (!this.props.triggerSave && nextProps.triggerSave) {
            this.save();
        }
    }

    save() {
        const {svc, onSave} = this.props;
        const {gettext, notify, contacts} = svc;

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
            .then((response) => {
                notify.pop();
                notify.success(gettext('contact saved.'));

                const result = replaceUrls(response);

                this.setState({
                    originalContact: result,
                    currentContact: result,
                    dirty: false,
                }, onSave(result));
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
            errors: this.validateField(field, value, e),
        }, this.validateForm);
    }

    render() {
        const {svc, contact, onCancel, hideActionBar} = this.props;
        const {privileges} = svc;

        const readOnly = !get(privileges, 'privileges.contacts', false);

        return (
            <div id={contact._id} key={contact._id} className="contact-form">
                <form name="contactForm">
                    {!hideActionBar && <ActionBar
                        svc={svc}
                        readOnly={readOnly}
                        onSave={this.save}
                        onCancel={onCancel}
                        dirty={get(this.state, 'dirty', false)}
                        valid={get(this.state, 'isFormValid', false)} />}
                    <ContactProfile svc={svc}
                        contact={get(this.state, 'currentContact', {})}
                        dirty={get(this.state, 'dirty', false)}
                        onChange={this.onChange} readOnly={readOnly}
                        errors={get(this.state, 'errors', {})} />
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

ContactFormContainer.defaultProps = {
    onDirty: () => { /* no-op */ },
    onValidation: () => { /* no-op */ },
    hideActionBar: false,
};
