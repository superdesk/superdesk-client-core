import React from 'react';

interface IProps {
    annotationInputComponent: React.ReactElement<any>;
}

export class AnnotationInputWrapper extends React.Component<IProps> {
    render() {
        return this.props.annotationInputComponent;
    }
}
