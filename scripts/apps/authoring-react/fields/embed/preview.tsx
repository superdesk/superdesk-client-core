import React from 'react';
import {IPreviewComponentProps, IEmbedValueOperational, IEmbedConfig} from 'superdesk-api';
import {SpacerBlock} from 'core/ui/components/Spacer';
import {EmbedPreview} from './embed-preview';

type IProps = IPreviewComponentProps<IEmbedValueOperational, IEmbedConfig>;

export class Preview extends React.PureComponent<IProps> {
    render() {
        if ((this.props.value?.embed ?? '').trim().length < 1) {
            return null;
        }

        const {embed, description} = this.props.value;

        return (
            <div>
                {
                    description?.length > 0 && (
                        <div>
                            <span>{description}</span>

                            <SpacerBlock v gap="16" />
                        </div>
                    )
                }

                <EmbedPreview embedHtml={embed} />
            </div>
        );
    }
}
