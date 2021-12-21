import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {PanelContent} from './panel/panel-content';
import {PanelFooter} from './panel/panel-footer';
import ng from 'core/services/ng';
import {cloneDeep} from 'lodash';
import {notify} from 'core/notify/notify';

interface IProps {
    item: IArticle;
    closePublishView(): void;
    handleUnsavedChanges(): Promise<IArticle>;
    markupV2: boolean;
}

export class SendCorrectionTab extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.doSendCorrection = this.doSendCorrection.bind(this);
    }

    doSendCorrection(): void {
        this.props.handleUnsavedChanges()
            .then((item) => {
                // Cloning to prevent objects from being modified by angular
                ng.get('authoring').publish(
                    cloneDeep(item),
                    cloneDeep(item),
                    'correct',
                ).then(() => {
                    ng.get('authoringWorkspace').close();
                    notify.success('Correction sent');
                });
            })
            .catch(() => {
                // cancelled by user
            });
    }

    render() {
        const {markupV2} = this.props;

        return (
            <React.Fragment>
                <PanelContent markupV2={markupV2}>
                    <div>
                        {gettext('No options available.')}
                    </div>
                </PanelContent>

                <PanelFooter markupV2={markupV2}>
                    <Button
                        text={gettext('Send correction')}
                        onClick={() => {
                            this.doSendCorrection();
                        }}
                        size="large"
                        type="highlight"
                        expand
                    />
                </PanelFooter>
            </React.Fragment>
        );
    }
}
