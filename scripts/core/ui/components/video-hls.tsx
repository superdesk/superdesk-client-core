import React from 'react';
import Hls from 'hls.js';

interface IProps {
    poster: string;
    streamUrl: string;
    width?: string;
    height?: string;
}

export class HLSVideoComponent extends React.PureComponent<IProps> {
    videoElement: HTMLElement;
    hls: Hls;

    private initHLS = () => {
        if (Hls.isSupported() && this.videoElement) {
            this.hls = new Hls();
            this.hls.loadSource(this.props.streamUrl);
            this.hls.attachMedia(this.videoElement);
        }
    }

    private destroyHLS = () => {
        if (this.hls) {
            this.hls.stopLoad();
            this.hls.destroy();
        }
    }

    componentDidMount(): void {
        this.initHLS();
    }

    componentWillUnmount(): void {
        this.destroyHLS();
    }

    render() {
        return (
            <video controls
                preload="metadata"
                ref={(el) => this.videoElement = el}
                poster={this.props.poster}
                width={this.props.width}
                height={this.props.height}
            />
        );
    }
}
