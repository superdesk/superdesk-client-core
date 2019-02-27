import React from 'react';
import {NavTabs} from 'core/ui/components';
import {AnnotationsSelect} from './AnnotationsSelect';

interface IProps {
    annotationText: string;
    annotationInputComponent: React.ReactElement<any>;
    onApplyAnnotation(contentPlainText: string): void;
}

export class AnnotationInputFidely extends React.Component<IProps> {
    render() {
        const tabs = [
            {
                label: gettext('Annotation library'),
                render: () => (
                    <AnnotationsSelect
                        annotationText={this.props.annotationText}
                        annotationTypes={[]}
                        onApplyAnnotation={() => {
                            console.log('test');
                        }}
                    />
                ),
            },
            {
                label: gettext('New annotation'),
                render: () => this.props.annotationInputComponent,
            },
        ];

        return <NavTabs tabs={tabs} active={0} />;
    }
}
