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
    componentDidMount() {
        this.props.video.current!.addEventListener('loadeddata', this.videoOnloaded);
    }
    videoOnloaded = () => {
        this.props.onTrim(0, this.props.video.current!.duration);
    };

    componentWillUnmount() {
        this.props.video.current!.removeEventListener('loadeddata', this.videoOnloaded);
    }

    onDragCbStart(e: React.DragEvent<HTMLDivElement>) {
        var img = document.createElement('img');
        e.dataTransfer.setDragImage(img, 0, 0);
        e.dataTransfer.setData('text/plain', '');
    }

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
        if (e.clientX) {
            let time = this.getPositionBar(e.clientX) * this.props.video.current!.duration;
            if (type == 'left') {
                this.props.onTrim(time, this.props.trim.end);
            }
            if (type == 'right') {
                this.props.onTrim(this.props.trim.start, time);
            }
        }
    };
    onDragCbEnd() {}

    getStrTime(s: number) {
        let mins: number = Math.floor(s / 60);
        let secs: number = Math.floor(s % 60);
        let li = Math.floor((s * 10) % 10);
        return (mins < 10 ? '0' + mins : mins) + ':' + (secs < 10 ? '0' + secs : secs) + '.' + li;
    }

    render() {
        const { getClass } = this.context;
        const video = this.props.video.current!;
        //set state for control left, right bar
        const left = video ? `${(this.props.trim.start / video.duration) * 100}%` : '0%';
        const right = video ? `${(1 - this.props.trim.end / video.duration) * 100}%` : '0%';
        const leftStrTime = this.getStrTime(this.props.trim.start);
        const rightStrTime = this.getStrTime(this.props.trim.end);
        return (
            <div className={getClass('timeline-controls')}>
                <ListThumbnails thumbnails={[]} widthPic={90} numberThumbnails={7} video={this.props.video} />
                <div className={`${getClass('controlbars')}`} ref={this.controlbar}>
                    <div
                        className={`${getClass('controlbars__mask')} ${getClass('controlbars__mask--left')}`}
                        style={{
                            width: left,
                        }}
                    ></div>
                    <div
                        className={`${getClass('controlbars__mask')} ${getClass('controlbars__mask--right')}`}
                        style={{
                            width: right,
                        }}
                    ></div>
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
                            left: left,
                            right: right,
                        }}
                    >
                        <div
                            className={`${getClass('controlbars__wrapper')} ${getClass('controlbars__wrapper--left')}`}
                            draggable={true}
                            onDragStart={this.onDragCbStart}
                            onDrag={(e: React.DragEvent<HTMLDivElement>) => this.onDragCb(e, 'left')}
                            onDragEnd={this.onDragCbEnd}
                            data-content={leftStrTime}
                        ></div>
                        <div
                            className={`${getClass('controlbars__wrapper')} ${getClass('controlbars__wrapper--right')}`}
                            draggable={true}
                            onDragStart={this.onDragCbStart}
                            onDrag={(e: React.DragEvent<HTMLDivElement>) => this.onDragCb(e, 'right')}
                            onDragEnd={this.onDragCbEnd}
                            data-content={rightStrTime}
                        ></div>
                    </div>
                </div>
            </div>
        );
    }
}
