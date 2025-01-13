import React from 'react';
import {ItemContainer} from 'apps/contacts/components';
import {ContactName, Notes, JobTitle} from 'apps/contacts/components/fields';
import {isEmpty, findKey} from 'lodash';
import {gettext} from 'core/utils';
import {IContact} from 'superdesk-api';
import {ContentDivider, Icon, Spacer} from 'superdesk-ui-framework/react';

interface IProps {
    item: IContact;
    showIfContactIsInactive?: string;
    hideHeader?: boolean;
}

/**
 * Media Contact Info - renders contact's information
 */
export const ContactInfo: React.FunctionComponent<IProps> = ({
    item,
    showIfContactIsInactive,
    hideHeader,
}) => {
    const meta = [];
    const info = [];

    const contactJobTitle = item.job_title ? <JobTitle item={item} /> : null;
    const contactOrg = item.first_name && item.organisation ?
        <span>{item.organisation}</span> : null;

    if (hideHeader != true) {
        info.push(
            <Spacer style={{margin: '8px 0'}} h gap="8" justifyContent="start" alignItems="center" noWrap>
                <div
                    style={{
                        backgroundColor: 'var(--sd-colour-success)',
                        borderRadius: '50%',
                        width: 36,
                        height: 36,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Icon size="small" color="white" name={`${item.first_name ? 'user' : 'business'}`} />
                </div>
                <h3 key="contact-name">
                    <ContactName item={item} />
                    {contactJobTitle && <span title={item.job_title}>{contactJobTitle}</span>}
                </h3>
                <div key="contact-org">
                    <span className="item-info">{contactOrg}</span>
                    {!item.is_active && showIfContactIsInactive && (
                        <span
                            title="inactive"
                            className="label label--draft label--hollow pull-right"
                        >
                            {gettext('Inactive')}
                        </span>
                    )}
                </div>
            </Spacer>,
        );
    }

    meta.push(
        <Spacer v gap="4" justifyContent="center" alignItems="center" noWrap>
            <ContentDivider margin="x-small" orientation="horizontal" type="dotted" />
            <Spacer h gap="8" justifyContent="start" alignItems="center" noWrap>
                <Icon name="envelope" size="small" />
                {!isEmpty(item.contact_email) && (<ItemContainer item={item} field="contact_email" />)}
            </Spacer>
            <ContentDivider margin="x-small" orientation="horizontal" type="dotted" />
        </Spacer>,
    );

    meta.push(
        <Spacer v gap="4" justifyContent="center" alignItems="center" noWrap>
            <Spacer h gap="8" justifyContent="start" alignItems="center" noWrap>
                <Icon name="globe" size="small" />
                {!isEmpty(item.contact_phone) && findKey(item.contact_phone, 'number') &&
                    (<ItemContainer item={item} field="contact_phone" />)
                }
            </Spacer>
            <ContentDivider margin="x-small" orientation="horizontal" type="dotted" />
        </Spacer>,
    );

    meta.push(
        <Spacer v gap="4" justifyContent="center" alignItems="center" noWrap>
            <Spacer h gap="8" justifyContent="start" alignItems="center" noWrap>
                <Icon name="phone" size="small" />
                {item.website && (<ItemContainer item={item} field="website" />)}
            </Spacer>
            <ContentDivider margin="x-small" orientation="horizontal" type="dotted" />
        </Spacer>,
    );

    meta.push(
        <Spacer v gap="4" justifyContent="center" alignItems="center" noWrap>
            <Spacer h gap="8" justifyContent="start" alignItems="center" noWrap>
                <Icon name="mobile" size="small" />
                {!isEmpty(item.mobile) && findKey(item.mobile, 'number') &&
                    (<ItemContainer item={item} field="mobile" />)
                }
            </Spacer>
            <ContentDivider margin="x-small" orientation="horizontal" type="dotted" />
        </Spacer>,
    );

    meta.push(
        <Spacer v gap="4" justifyContent="center" alignItems="center" noWrap>
            <Spacer h gap="8" justifyContent="start" alignItems="center" noWrap>
                <Icon name="map-marker" size="small" />
                {item && (<ItemContainer item={item} field="location" />)}
            </Spacer>
            <ContentDivider margin="x-small" orientation="horizontal" type="dotted" />
        </Spacer>,
    );

    info.push(
        <Spacer v gap="4" justifyContent="space-between" alignItems="center">
            {meta}
            <Spacer h gap="8" justifyContent="start" alignItems="center" noWrap>
                <Icon name="info-sign" size="small" />
                {item.notes && (<Notes item={item} />)}
            </Spacer>
        </Spacer>,
    );

    return (
        <div className="sd-grid-item__content" x-ms-format-detection="none">{info}</div>
    );
};
