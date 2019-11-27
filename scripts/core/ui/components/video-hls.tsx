import React from 'react';
import Hls from 'hls.js';


interface IProps {
    poster: string;
    streamUrl: string
}


export class HLSVideoComponent extends React.PureComponent<IProps> {
    videoElement: HTMLElement;
    hls: Hls;

    _initHLS = () => {
        if (Hls.isSupported() && this.videoElement) {
            this.hls = new Hls();
            this.hls.loadSource(this.props.streamUrl);
            this.hls.attachMedia(this.videoElement);
        }
    };

    _destroyHLS = () => {
        this.hls.stopLoad();
        this.hls.destroy();
    };

    componentDidUpdate(prevProps: Readonly<IProps>, prevState: Readonly<{}>, snapshot?: any): void {
        if (this.props.streamUrl !== prevProps.streamUrl) {
            this._destroyHLS();
            this._initHLS();
        }
    }

    componentDidMount(): void {
        this._initHLS();
    }

    componentWillUnmount(): void {
        this._destroyHLS();
    }

    render() {
        return (
            <video controls
                preload="metadata"
                ref={(el) => this.videoElement = el}
                poster={this.props.poster}
            />
        );
    }
}
