import React from 'react';
import {ErrorInfo} from 'react';
import {logger} from 'core/services/logger';

interface IState {
    hasError: boolean;
}

export class ErrorBoundary extends React.PureComponent<{}, IState> {
    constructor(props) {
        super(props);

        this.state = {
            hasError: false,
        };
    }

    static getDerivedStateFromError(error) {
        return {hasError: true};
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        logger.error(error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return null;
        } else {
            return this.props.children;
        }
    }
}
