import React from 'react';
import PropTypes from 'prop-types';
import {ProfileHeader} from './ProfileHeader';
import {ProfileDetail} from './ProfileDetail';
import {getContactType} from '../../../contacts/helpers';
import {get} from 'lodash';

export class ContactProfile extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            contactType: 'person'
        };
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            contactType: getContactType(nextProps.contact)
        });
    }

    render() {
        const {svc, contact, dirty, onChange, readOnly, errors, onChangeContactType} = this.props;

        return (
            <div className="profile-info">
                <ProfileHeader contact={contact} svc={svc} dirty={dirty} onChange={onChange}
                    readOnly={readOnly} contactType={get(this.state, 'contactType', 'person')} />
                <ProfileDetail contact={contact} svc={svc} onChange={onChange}
                    readOnly={readOnly} errors={errors} contactType={get(this.state, 'contactType', 'person')}
                    onChangeContactType={onChangeContactType} />
            </div>
        );
    }
}

ContactProfile.propTypes = {
    svc: PropTypes.object.isRequired,
    contact: PropTypes.object.isRequired,
    dirty: PropTypes.bool,
    readOnly: PropTypes.bool,
    onChange: PropTypes.func,
    onChangeContactType: PropTypes.func,
    errors: PropTypes.object,
};
