import React, { Component } from 'react';

import './Modal.css';

class Modal extends Component {
	
	constructor(props) {
		super(props);
		this.state = {
			visible: false,
			handleOkClick: () => {this.setState({ visible: false });},
			handleCancelClick: () => {this.setState({ visible: false });},
			handleStopClick: () => {this.setState({ visible: false });}
		};
	}

	static defaultProps = {
		...Component.defaultProps,
		title: '',
		okCancel: false,
		ok: false,
		handleOkClick: null,
		handleCancelClick: null,
		handleStopClick: null
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.handleOkClick) {
			this.setState({ handleOkClick: nextProps.handleOkClick });
		}

		if (nextProps.handleCancelClick) {
			this.setState({ handleCancelClick: nextProps.handleCancelClick });
		}

		if (nextProps.handleStopClick) {
			this.setState({ handleStopClick: nextProps.handleStopClick });
		}
	}

	componentDidMount(){
		if (this.props.handleOkClick) {
			this.setState({ handleOkClick: this.props.handleOkClick });
		}

		if (this.props.handleCancelClick) {
			this.setState({ handleCancelClick: this.props.handleCancelClick });
		}

		if (this.props.handleStopClick) {
			this.setState({ handleStopClick: this.props.handleStopClick });
		}
	}

	toggleVisibility() {
		this.setState({ visible: !this.state.visible });
	}

	show() {
		this.setState({ visible: true });
	}

	hide() {
		this.setState({ visible: false });
	}

	render(){
		return (
			<div className={"custom-modal" + ((this.state.visible) ? "" : " hidden")}>
				<div className="modal-background"></div>

					<div className={"modal-container " + ((this.props.wide)? "wide":"")}>
						<div className="modal-header">
							<div className="modal-title">{this.props.title}</div>
							<div className="exit-button" onClick={() => {this.hide(); if (this.state.handleCancelClick) this.state.handleCancelClick(); }}><i className="fa fa-times" aria-hidden="true"></i></div>
						</div>
						<div className="modal-inner-content">
							{this.props.children}
						</div>
						{
							(this.props.okCancel)? 
								<div className="modal-footer">
									<button type="button" className="btn btn-secondary btnOk" onClick={this.state.handleOkClick}><i className="fa fa-check" aria-hidden="true"></i> OK</button>
									<button type="button" className="btn btn-secondary btnCancel" onClick={this.state.handleCancelClick}><i className="fa fa-times" aria-hidden="true"></i> Cancel</button>
								</div>
							:''
						}
						
						{
							 (this.props.ok)? 
								<div className="modal-footer">
									<button type="button" className="btn btn-secondary btnOk" onClick={this.state.handleOkClick}><i className="fa fa-check" aria-hidden="true"></i> OK</button>
								</div>
							:''
						}

{
							 (this.props.stop)? 
								<div className="modal-footer">
									<button type="button" className="btn btn-secondary btnStop" onClick={this.state.handleStopClick}><i className="fa fa-check" aria-hidden="true"></i> Stop</button>
								</div>
							:''
						}
						
					</div>
				
			</div>
		);
	}

}
export default Modal;

// const Modal = React.createClass({

// 	getDefaultProps: function () {
// 		return {
// 			title: '',
// 			okCancel: false,
// 			ok: false,
// 			handleOkClick: null,
// 			handleCancelClick: null
// 		};
// 	},

// 	getInitialState() {
// 		return {
// 			visible: false,
// 			handleOkClick: () => {this.setState({ visible: false });},
// 			handleCancelClick: () => {this.setState({ visible: false });}
// 		};
// 	},

// 	componentWillReceiveProps(nextProps) {
// 		if (nextProps.handleOkClick) {
// 			this.setState({ handleOkClick: nextProps.handleOkClick });
// 		}

// 		if (nextProps.handleCancelClick) {
// 			this.setState({ handleCancelClick: nextProps.handleCancelClick });
// 		}
// 	},

// 	componentDidMount(){
// 		if (this.props.handleOkClick) {
// 			this.setState({ handleOkClick: this.props.handleOkClick });
// 		}

// 		if (this.props.handleCancelClick) {
// 			this.setState({ handleCancelClick: this.props.handleCancelClick });
// 		}
// 	},

// 	handleKeyDown(e) {
// 		if (e.key == "Enter") this.hide();
// 		if (e.key == "Escape") this.hide();
// 	},

// 	toggleVisibility() {
// 		this.setState({ visible: !this.state.visible });
// 	},

// 	show() {
// 		this.setState({ visible: true });
// 	},

// 	hide() {
// 		this.setState({ visible: false });
// 	},

// 	render: function () {


// 		return (
// 			<div className={"custom-modal" + ((this.state.visible) ? "" : " hidden")} onKeyDown={this.handleKeyDown}>
// 				<div className="modal-background" onClick={() => {this.hide(); if (this.state.handleCancelClick) this.state.handleCancelClick(); }}></div>

// 					<div className="modal-container col-md-6 col-md-offset-3 col-sm-8 col-sm-offset-2">
// 						<div className="modal-header">
// 							<div className="modal-title">{this.props.title}</div>
// 							<div className="exit-button" onClick={() => {this.hide(); if (this.state.handleCancelClick) this.state.handleCancelClick(); }}><i className="fa fa-times" aria-hidden="true"></i></div>
// 						</div>
// 						<div className="modal-inner-content">
// 							{this.props.children}
// 						</div>
// 						{
// 							(this.props.okCancel)? 
// 								<div className="modal-footer">
// 									<button type="button" className="btn btn-secondary btnOk" onClick={this.state.handleOkClick}><i className="fa fa-check" aria-hidden="true"></i> OK</button>
// 									<button type="button" className="btn btn-secondary btnCancel" onClick={this.state.handleCancelClick}><i className="fa fa-times" aria-hidden="true"></i> Cancel</button>
// 								</div>
// 							:''
// 						}
						
// 						{
// 							 (this.props.ok)? 
// 								<div className="modal-footer">
// 									<button type="button" className="btn btn-secondary btnOk" onClick={this.state.handleOkClick}><i className="fa fa-check" aria-hidden="true"></i> OK</button>
// 								</div>
// 							:''
// 						}
						
// 					</div>
				
// 			</div>
// 		);
// 	}

// });



// module.exports = Modal;