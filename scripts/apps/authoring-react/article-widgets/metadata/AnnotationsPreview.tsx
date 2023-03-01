import {getAllAnnotations} from 'apps/archive/directives/HtmlPreview';
import {Spacer} from 'core/ui/components/Spacer';
import {gettext} from 'core/utils';
import React from 'react';
import {IArticle} from 'superdesk-api';
import {Label, ToggleBox} from 'superdesk-ui-framework/react';

interface IProps {
    article: IArticle;
}

export class AnnotationsPreview extends React.Component<IProps> {
    render(): React.ReactNode {
        const {article} = this.props;

        return (
            <div>
                <div dangerouslySetInnerHTML={{__html: article.archive_description}} />
                <ToggleBox title={gettext('Annotations')}>
                    {
                        (article?.annotations?.length ?? 0) > 0 && (
                            getAllAnnotations(article).map((a) => (
                                <Spacer h gap="4" key={a.id} noWrap>
                                    <Label text={a.type} style="hollow" type="primary" />
                                    <div>
                                        <span
                                            className="annotation-body-react"
                                            dangerouslySetInnerHTML={{__html: a.body}}
                                        />
                                        <sup className="annotation-id">
                                            {a.id}
                                        </sup>
                                    </div>
                                </Spacer>
                            ))
                        )
                    }
                </ToggleBox>
            </div>
        );
    }
}
