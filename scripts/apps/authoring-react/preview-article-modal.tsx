import React from 'react';
import {IContentProfileV2} from 'superdesk-api';
import {showPrintableModal} from 'core/services/modalService';
import {PreviewAuthoringItem} from './preview-authoring-item';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';

export function previewAuthoringEntity(
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
                <PreviewAuthoringItem
                    key="0"
                    profile={profile}
                    fieldsData={fieldsData}
                />,
            ]}
        />
    ));
}
