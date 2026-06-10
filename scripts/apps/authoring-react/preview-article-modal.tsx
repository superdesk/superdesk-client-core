import React from 'react';
import {IContentProfileV2} from 'superdesk-api';
import {showPrintableModal} from 'core/services/modalService';
import {PreviewAuthoringItem} from './preview-authoring-item';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {formatDate} from 'core/get-superdesk-api-implementation';

export function previewAuthoringEntity(
    item: any,
    profile: IContentProfileV2,
    fieldsData: Immutable.Map<string, any>,
    label?: string,
) {
    showPrintableModal(({closeModal, Wrapper, showPrintDialog}) => (
        <Wrapper
            toolbar={(
                <React.Fragment>
                    <div>
                        {label != null && <div>{label}</div>}
                    </div>

                    <div>
                        <Button
                            text={gettext('Print')}
                            icon="print"
                            iconOnly
                            style="hollow"
                            onClick={() => {
                                showPrintDialog();
                            }}
                        />

                        <Button
                            text={gettext('Close')}
                            icon="close-small"
                            iconOnly
                            style="hollow"
                            onClick={() => {
                                closeModal();
                            }}
                        />
                    </div>
                </React.Fragment>
            )}
            contentSections={[
                <React.Fragment key="0">
                    {item.versioncreated != null && (
                        <div className="css-table" data-test-id="print-preview-last-modified">
                            <div className="tr">
                                <div className="td" style={{paddingBlockEnd: 4}}>
                                    <span className="form-label">{gettext('Last modified')}</span>
                                </div>
                                <div className="td" style={{paddingInlineStart: 30, paddingBlockEnd: 4}}>
                                    {formatDate(new Date(item.versioncreated))}
                                </div>
                            </div>
                        </div>
                    )}

                    <br />

                    <PreviewAuthoringItem
                        item={item}
                        profile={profile}
                        fieldsData={fieldsData}
                    />
                </React.Fragment>,
            ]}
        />
    ));
}
