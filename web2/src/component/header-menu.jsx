/*
* 页面顶部菜单的组件
*/

import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import ClassBind from 'classnames/bind';
import { connect } from 'react-redux';
import { message, Modal, Spin, Popover, Button, Icon } from 'antd';
import {
    resumeRecording,
    stopRecording,
    updateLocalInterceptHttpsFlag,
    updateLocalGlobalProxyFlag,
    toggleRemoteInterceptHttpsFlag,
    toggleRemoteGlobalProxyFlag
} from 'action/globalStatusAction';

import { clearAllRecord } from 'action/recordAction';
import { getJSON } from 'common/ApiUtil';

import Style from './header-menu.less';
import CommonStyle from '../style/common.less';

const StyleBind = ClassBind.bind(Style);

class HeaderMenu extends React.Component {
    constructor () {
        super();
        this.state = {
            ruleSummary: '',
            runningDetailVisible: false
        };

        this.stopRecording = this.stopRecording.bind(this);
        this.resumeRecording = this.resumeRecording.bind(this);
        this.clearAllRecord = this.clearAllRecord.bind(this);
        this.initEvent = this.initEvent.bind(this);
        this.fetchData = this.fetchData.bind(this);
        this.togglerHttpsIntercept = this.togglerHttpsIntercept.bind(this);
        this.showRunningInfo = this.showRunningInfo.bind(this);
        this.handleRuningInfoVisibleChange = this.handleRuningInfoVisibleChange.bind(this);
        this.toggleGlobalProxyFlag = this.toggleGlobalProxyFlag.bind(this);
    }

    static propTypes = {
        dispatch: PropTypes.func,
        globalStatus: PropTypes.object
    }

    stopRecording () {
        this.props.dispatch(stopRecording());
    }

    resumeRecording () {
        console.info('Resuming...');
        this.props.dispatch(resumeRecording());
    }

    clearAllRecord () {
        this.props.dispatch(clearAllRecord());
    }

    handleRuningInfoVisibleChange (visible) {
        this.setState({
            runningDetailVisible: visible
        });
    }
    showRunningInfo () {
        this.setState({
            runningDetailVisible: true
        });
    }

    togglerHttpsIntercept () {
        const self = this;
        // if no rootCA exists, inform the user about trust the root
        if (!this.state.rootCAExists) {
            Modal.info({
                title: 'AnyProxy is about to generate the root CA for you',
                content: (
                    <div>
                        <span>Trust the root CA before AnyProxy can do HTTPS proxy for you.</span>
                        <span>They will be located in
                            <a href="javascript:void(0)">{' ' + this.state.rootCADirPath}</a>
                        </span>
                    </div>
                ),
                width: 500,
                onOk () {
                    doToggleRemoteIntercept();
                }
            });
        } else {
            doToggleRemoteIntercept();
        }

        function doToggleRemoteIntercept () {
            const currentHttpsFlag = self.props.globalStatus.interceptHttpsFlag;
            self.props.dispatch(toggleRemoteInterceptHttpsFlag(!currentHttpsFlag));
        }

    }

    toggleGlobalProxyFlag () {
        const currentGlobalProxyFlag = this.props.globalStatus.globalProxyFlag;
        this.props.dispatch(toggleRemoteGlobalProxyFlag(!currentGlobalProxyFlag));
    }

    initEvent () {
        document.addEventListener('keyup', (e) => {
            if (e.keyCode == 88 && e.ctrlKey) {
                this.clearAllRecord();
            }
        });
    }

    fetchData () {
        getJSON('/api/getInitData')
            .then((resposne) => {
                this.setState({
                    ruleSummary: resposne.ruleSummary,
                    rootCAExists: resposne.rootCAExists,
                    rootCADirPath: resposne.rootCADirPath,
                    ipAddress: resposne.ipAddress,
                    port: resposne.port
                });
                this.props.dispatch(updateLocalInterceptHttpsFlag(resposne.currentInterceptFlag));
                this.props.dispatch(updateLocalGlobalProxyFlag(resposne.currentGlobalProxyFlag));
            })
            .catch((error) => {
                console.error(error);
                message.error('Failed to get rule summary');
            });
    }

    componentDidMount () {
        this.fetchData();
        this.initEvent();
    }

    render () {
        const { globalStatus } = this.props;

        const stopMenuStyle = StyleBind('menuItem', { 'disabled': globalStatus.recording !== true });
        const resumeMenuStyle = StyleBind('menuItem', { 'disabled': globalStatus.recording === true });

        const interceptHttpsStyle = StyleBind('menuItem', { 'active': globalStatus.interceptHttpsFlag });
        const globalProxyStyle = StyleBind('menuItem', { 'active': globalStatus.globalProxyFlag });

        const runningInfoDiv = (
            <div >
                <ul>
                    <li>
                        <strong>Active Rule:</strong>
                        <span>{this.state.ruleSummary}</span>
                    </li>
                    <li>
                        <strong>Host Address:</strong>
                        <span>{this.state.ipAddress}</span>
                    </li>
                    <li>
                        <strong>Listening on:</strong>
                        <span>{this.state.port}</span>
                    </li>
                    <li>
                        <strong>Proxy Protocol:</strong>
                        <span>HTTP</span>
                    </li>
                </ul>
                <div className={Style.okButton}>
                    <Button type="primary" onClick={this.handleRuningInfoVisibleChange.bind(this, false)} > OK </Button>
                </div>
            </div>
        );

        const stopRecordingMenu = (
            <a
                className={stopMenuStyle}
                href="javascript:void(0)"
                onClick={this.stopRecording}
            >
                <i className="fa fa-stop" />
                <span>Stop</span>
            </a>
        );

        const resumeRecordingMenu = (
            <a
                className={resumeMenuStyle}
                href="javascript:void(0)"
                onClick={this.resumeRecording}
            >
                <i className="fa fa-play" />
                <span>Resume</span>
            </a>
        );

        return (
          <div className={Style.topWrapper} >
            <div className={Style.menuList} >
                {globalStatus.recording ? stopRecordingMenu : resumeRecordingMenu}
                <a
                    className={Style.menuItem}
                    href="javascript:void(0)"
                    onClick={this.clearAllRecord}
                    title="Ctrl + X"
                >
                    <i className="fa fa-eraser" />
                    <span>Clear</span>
                </a>

                <span className={Style.menuItemSpliter} />

                <a
                    className={interceptHttpsStyle}
                    href="javascript:void(0)"
                    onClick={this.togglerHttpsIntercept}
                    title="Enable or Disable the HTTPS intercept"
                >
                    <i className="fa fa-eye-slash" />
                    <span>Inercept HTTPS</span>
                </a>

                <a
                    className={globalProxyStyle}
                    href="javascript:void(0)"
                    onClick={this.toggleGlobalProxyFlag}
                    title="Enable or Disable the HTTPS intercept"
                >
                    <i className="fa fa-tachometer" />
                    <span>System Proxy</span>
                </a>

                <Popover
                    content={runningInfoDiv}
                    trigger="click"
                    title="AnyProxy Running Info"
                    visible={this.state.runningDetailVisible}
                    onVisibleChange={this.handleRuningInfoVisibleChange}
                    placement="bottomRight"
                    overlayClassName={Style.runningInfoDivWrapper}
                >
                    <a
                        className={Style.menuItem + ' ' + Style.rightMenuItem}
                        href="javascript:void(0)"
                    >
                        <Icon type="info-circle" />
                        <span>Proxy Info</span>
                    </a>
                </Popover>
            </div>
          </div>
        );
    }
}

function select (state) {
    return {
        globalStatus: state.globalStatus
    };
}

export default connect(select)(HeaderMenu);