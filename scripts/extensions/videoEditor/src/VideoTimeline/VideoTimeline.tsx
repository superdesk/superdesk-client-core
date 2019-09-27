import * as React from 'react';
// import { Bar } from '../assets/bar.svg';
import { BarIcon } from './BarIcon';
import { ListThumbnails } from './ListThumbnails';

type IProps = {
    video: React.RefObject<HTMLVideoElement>;
    trim: {
        start: number;
        end: number;
    };
    onTrim: (start: number, end: number) => void;
    getClass: Function;
};
type IState = {};

export class VideoTimeline extends React.Component<IProps, IState> {
    private cbwrapper: React.RefObject<HTMLDivElement>;
    private innerPlay: React.RefObject<HTMLDivElement>;

    constructor(props: IProps) {
        super(props);
        this.state = {
            trim: {
                start: 0,
                end: 0,
            },
        };
        this.cbwrapper = React.createRef();
        this.innerPlay = React.createRef();
    }
    onDragCbStart() {}
    onDragCb() {}
    onDragCbEnd() {}

    render() {
        const { getClass } = this.props;
        const video = this.props.video.current!;
        return (
            <div className={getClass('timeline-controls')}>
                <ListThumbnails
                    thumbnails={[]}
                    widthPic={90}
                    numberThumbnails={7}
                    video={this.props.video}
                    getClass={getClass}
                />
                <div className={`${getClass('controlbars')}`}>
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
                            left: video ? `${(this.props.trim.start / video.duration) * 100} %` : '0%',
                            right: video ? `${(1 - this.props.trim.end / video.duration) * 100} %` : '0%',
                        }}
                    >
                        <div
                            className={`${getClass('controlbars__wrapper')} ${getClass('cb-left')}`}
                            draggable={true}
                            onDragStart={this.onDragCbStart}
                            onDrag={this.onDragCb}
                            onDragEnd={this.onDragCbEnd}
                        ></div>
                        <div
                            className={`${getClass('controlbars__wrapper')} ${getClass('cb-right')}`}
                            draggable={true}
                            onDragStart={this.onDragCbStart}
                            onDrag={this.onDragCb}
                            onDragEnd={this.onDragCbEnd}
                        ></div>
                    </div>
                </div>
            </div>
        );
    }
}
