import * as React from 'react';
import { BarIcon } from './BarIcon';
import { ListThumbnails } from './ListThumbnails';
import VideoEditorContext from '../VideoEditorContext';

type IProps = {
    video: React.RefObject<HTMLVideoElement>;
    trim: {
        start: number;
        end: number;
    };
    onTrim: (start: number, end: number) => void;
};
type IState = {};

export class VideoTimeline extends React.Component<IProps, IState> {
    static contextType = VideoEditorContext;
    private cbwrapper: React.RefObject<HTMLDivElement>;
    private innerPlay: React.RefObject<HTMLDivElement>;
    private controlbar: React.RefObject<HTMLDivElement>;

    constructor(props: IProps) {
        super(props);
        this.state = {};
        this.cbwrapper = React.createRef();
        this.innerPlay = React.createRef();
        this.controlbar = React.createRef();
    }

    onDragCbStart() {}

    getPositionBar = (pX: number) => {
        const controlbar = this.controlbar.current!;
        var position = (pX - controlbar.getBoundingClientRect().left) / controlbar.offsetWidth;
        if (position > 1) {
            position = 1;
        }
        if (position < 0) {
            position = 0;
        }
        position = Math.floor(position * 100) / 100;
        return position;
    };

    onDragCb = (e: React.DragEvent<HTMLDivElement>, type: string) => {
        if (type == 'left') {
            let start = this.getPositionBar(e.clientX) * this.props.video.current!.duration;
            this.props.onTrim(start, this.props.trim.end);
        }
    };
    onDragCbEnd() {}

    render() {
        const { getClass } = this.context;
        const video = this.props.video.current!;
        return (
            <div className={getClass('timeline-controls')}>
                <ListThumbnails thumbnails={[]} widthPic={90} numberThumbnails={7} video={this.props.video} />
                <div className={`${getClass('controlbars')}`} ref={this.controlbar}>
                    <div className={`${getClass('controlbars__mask')} ${getClass('left')}`}></div>
                    <div className={`${getClass('controlbars__mask')} ${getClass('right')}`}></div>
                    <div className={getClass('controlbars__progress-output')}>
                        <div className={getClass('controlbars__progress-output__content')}>
                            <BarIcon />
                            <div
                                ref={this.innerPlay}
                                className={getClass('controlbars__progress-output__content__inner')}
                            >
                                00:00.0
                            </div>
                        </div>
                        <div className={getClass('controlbars__progress-output__progress-line')}></div>
                    </div>
                    <div
                        ref={this.cbwrapper}
                        className={`${getClass('controlbars__wrapper-out')}`}
                        style={{
                            left: video ? `${(this.props.trim.start / video.duration) * 100} %` : '3%',
                            right: video ? `${(1 - this.props.trim.end / video.duration) * 100} %` : '6%',
                        }}
                    >
                        <div
                            className={`${getClass('controlbars__wrapper')} ${getClass('cb-left')}`}
                            draggable={true}
                            onDragStart={this.onDragCbStart}
                            onDrag={(e: React.DragEvent<HTMLDivElement>) => this.onDragCb(e, 'left')}
                            onDragEnd={this.onDragCbEnd}
                        ></div>
                        <div
                            className={`${getClass('controlbars__wrapper')} ${getClass('cb-right')}`}
                            draggable={true}
                            onDragStart={this.onDragCbStart}
                            onDrag={e => this.onDragCb(e, 'right')}
                            onDragEnd={this.onDragCbEnd}
                        ></div>
                    </div>
                </div>
            </div>
        );
    }
}
