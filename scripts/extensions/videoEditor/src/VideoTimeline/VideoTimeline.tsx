import * as React from 'react';
import { BarIcon } from './BarIcon';
import { ListThumbnails } from './ListThumbnails';
import VideoEditorContext from '../VideoEditorContext';
import { ThumbnailObject } from '../VideoEditor';

interface IProps {
    video: React.RefObject<HTMLVideoElement>;
    thumbnails: Array<ThumbnailObject>;
    trim: {
        start: number;
        end: number;
    };
    onTrim: (start: number, end: number) => void;
}
interface IState {
    currentTime: number;
    intervalTimer: any;
}

export class VideoTimeline extends React.Component<IProps, IState> {
    static contextType = VideoEditorContext;
    private cbwrapper: React.RefObject<HTMLDivElement>;
    private controlbar: React.RefObject<HTMLDivElement>;

    constructor(props: IProps) {
        super(props);
        this.state = {
            currentTime: 0,
            intervalTimer: null,
        };
        this.cbwrapper = React.createRef();
        this.controlbar = React.createRef();
    }

    componentDidMount() {
        // call tick every 100ms to update current time state
        this.setState({
            intervalTimer: setInterval(this.tick, 100),
        });
    }

    componentWillUnmount() {
        clearInterval(this.state.intervalTimer);
    }

    getRenderThumbnails = (thumbnails: Array<ThumbnailObject>) => {
        //get list thumbnail render in list thumbnails get from server
        const video = this.props.video.current!;
        const widthPic = video && (50 * video.clientWidth) / video.clientHeight;
        const numberThumbnails =
            this.controlbar.current! && Math.floor(this.controlbar.current!.offsetWidth / widthPic);
        const duration = this.props.video.current! ? this.props.video.current!.duration : 0;
        let thumbnailsRender: Array<ThumbnailObject> = [];
        const per_delta_image =
            thumbnails.length > 1 ? (thumbnails.length - 1) / numberThumbnails : duration / numberThumbnails;
        for (let i = 0; i <= numberThumbnails; i++) {
            let thumnail: ThumbnailObject;
            if (this.props.thumbnails && this.props.thumbnails.length > 0) {
                thumnail = this.props.thumbnails[Math.round(i * per_delta_image)];
                thumbnailsRender.push(thumnail);
            } else {
                thumnail = {
                    url: '',
                    width: widthPic,
                    height: 50,
                };
                thumbnailsRender.push(thumnail);
                //Loading thumbnail one by one, if we call all api at same time, browser will lag.
            }
        }
        return thumbnailsRender;
    };
    tick = () => {
        // updates the current time state
        let currentTime = this.props.video.current!.currentTime;
        this.props.trim.end || currentTime < this.props.trim.end
            ? this.setState({ currentTime: currentTime })
            : this.props.video.current!.pause();
    };
    videoLoadedData = () => {
        //Set trim data when video loaded
        this.props.onTrim(0, this.props.video.current!.duration);
    };

    onDragCbStart(e: React.DragEvent<HTMLDivElement>) {
        //set shadow drag image is empty
        e.dataTransfer.setDragImage(document.createElement('img'), 0, 0);
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
        position = Math.floor(position * 1000) / 1000;
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

    onDragCbEnd = (e: React.DragEvent<HTMLDivElement>) => {
        this.setVideoCurrentTime(e.clientX);
    };

    controlbarsClick = (e: React.MouseEvent) => {
        let time = this.setVideoCurrentTime(e.clientX);
        if (time < this.props.trim.start) {
            this.props.onTrim(time, this.props.trim.end);
        }
        if (time > this.props.trim.end) {
            this.props.onTrim(this.props.trim.start, time);
        }
    };

    setVideoCurrentTime = (pX: number) => {
        let time = this.getPositionBar(pX) * this.props.video.current!.duration;
        this.props.video.current!.currentTime = time;
        this.setState({ currentTime: time });
        return time;
    };

    getStrTime(s: number) {
        let mins: number = Math.floor(s / 60);
        let secs: number = Math.floor(s % 60);
        let li = Math.floor((s * 10) % 10);
        return (mins < 10 ? '0' + mins : mins) + ':' + (secs < 10 ? '0' + secs : secs) + '.' + li;
    }

    render() {
        const { getClass } = this.context.superdesk.utilities.CSS;
        const video = this.props.video.current!;
        //set state for control left, right bar
        const left = video ? `${(this.props.trim.start / video.duration) * 100}%` : '0%';
        const right = video ? `${(1 - this.props.trim.end / video.duration) * 100}%` : '0%';
        const thumnails = this.getRenderThumbnails(this.props.thumbnails);
        return (
            <div className={getClass('timeline-controls')}>
                <ListThumbnails thumbnails={thumnails} video={this.props.video} />
                <div className={`${getClass('controlbars')}`} ref={this.controlbar} onClick={this.controlbarsClick}>
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
                    <div
                        className={getClass('controlbars__progress-output')}
                        style={{
                            left: video ? `${(this.state.currentTime / video.duration) * 100}%` : '0%',
                        }}
                    >
                        <div className={getClass('controlbars__progress-output__content')}>
                            <BarIcon />
                            <div className={getClass('controlbars__progress-output__content__inner')}>
                                {this.getStrTime(this.state.currentTime)}
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
                            data-content={this.getStrTime(this.props.trim.start)}
                        ></div>
                        <div
                            className={`${getClass('controlbars__wrapper')} ${getClass('controlbars__wrapper--right')}`}
                            draggable={true}
                            onDragStart={this.onDragCbStart}
                            onDrag={(e: React.DragEvent<HTMLDivElement>) => this.onDragCb(e, 'right')}
                            onDragEnd={this.onDragCbEnd}
                            data-content={this.getStrTime(this.props.trim.end)}
                        ></div>
                    </div>
                </div>
            </div>
        );
    }
}
