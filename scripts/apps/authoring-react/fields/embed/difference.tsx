import React from 'react';
import {IDifferenceComponentProps, IEmbedConfig, IEmbedValueOperational} from 'superdesk-api';
import {generateHtmlDiff} from 'apps/authoring-react/generate-html-diff';
import {Spacer} from 'core/ui/components/Spacer';
import {escape as escapeHtml} from 'lodash';

type IProps = IDifferenceComponentProps<IEmbedValueOperational, IEmbedConfig>;

export class Difference extends React.PureComponent<IProps> {
    render() {
        const {value1, value2} = this.props;

        const embed1 = value1?.embed ?? '';
        const embed2 = value2?.embed ?? '';

        const description1 = value1?.description ?? '';
        const description2 = value2?.description ?? '';

        return (
            <Spacer v gap="16">
                {
                    (embed1.length > 0 || embed2.length > 0) && (
                        <div
                            dangerouslySetInnerHTML={{__html: generateHtmlDiff(escapeHtml(embed1), escapeHtml(embed2))}}
                        />
                    )
                }

                {
                    (description1.length > 0 || description2.length > 0) && (
                        <div dangerouslySetInnerHTML={{__html: generateHtmlDiff(description1, description2)}} />
                    )
                }
            </Spacer>
        );
    }
}
