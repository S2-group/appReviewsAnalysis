import React, { Component } from 'react';
import PropTypes from 'prop-types';
import InputRange from 'react-input-range';
const css = require('react-input-range/lib/css/input-range/input-range.css');
const css2 = require('./RangePicker.css');

export default class RangePicker extends Component {
	constructor(props) {
		super(props);
		this.state = {
			values: {
				min: props.defaultFrom || props.minValue,
				max: props.defaultTo || props.maxValue
			},
			txtMinValue: props.defaultFrom || props.minValue,
			txtMaxValue: props.defaultTo || props.maxValue
		};
	}

	static defaultProps = {
	
	};

	handleValuesChange(component, values) {
		this.setState({
			values: values,
			txtMinValue: 0,
			txtMaxValue: 0
		});
		this.setState({ txtMinValue: values.min, txtMaxValue: values.max });
	}

  handleChangeComplete(component, value) {
	if(this.props.onApplyFilters){
		var oEvent = {
			action:'add',
			type:'range',
			facet:this.props.facet,
			value:'[' + value.min + ' TO ' + value.max + ']'
		};
		this.props.onApplyFilters(oEvent);
		}
	}

	handleInputKeypress(e) {
		if (e.target.value != "") {
			if (e.keyCode == 13) {
				//pressed enter
				if (e.target.id == "txtMin") {
					var min = (e.target.value == "-") ? 0 : this.state.txtMinValue;
					this.setValues(parseInt(min), this.state.values.max, "txtMin");
				} else if (e.target.id == "txtMax") {
					var max = (e.target.value == "-") ? 0 : this.state.txtMaxValue;
					this.setValues(this.state.values.min, parseInt(max), "txtMax");
				}
			}
		}
	}

	handleInputBlur(e) {
		if (e.target.value != "") {
			if (e.target.id == "txtMin") {
				var min = (e.target.value == "-") ? 0 : this.state.txtMinValue;
				this.setValues(parseInt(min), this.state.values.max, "txtMin");
			} else if (e.target.id == "txtMax") {
				var max = (e.target.value == "-") ? 0 : this.state.txtMaxValue;
				this.setValues(this.state.values.min, parseInt(max), "txtMax");
			}
		}
	}

	handleInputChange(e) {
		if (e.target.id == "txtMin") {
			if (e.target.value == "-" || !isNaN(e.target.value)) {
				this.setState({ txtMinValue: e.target.value });
			} else {
				//dont update the textbox at all, because its not a number
			}

		} else if (e.target.id == "txtMax") {
			if (e.target.value == "-" || !isNaN(e.target.value)) {
				this.setState({ txtMaxValue: e.target.value });
			} else {
				//dont update the textbox at all, because its not a number
			}
		}
	}

	setValues(inputMin, inputMax, beingChanged) {
		if (inputMin == "-") inputMin = 0;
		if (inputMax == "-") inputMax = 0;

		if ((inputMin >= (this.props.minValue)) && (inputMax <= (this.props.maxValue))) {
			//input was within range
			if (inputMin < inputMax) {
				//inputs are logical
				this.setState({ values: { min: inputMin, max: inputMax } });
				this.handleChangeComplete(null, { min: inputMin, max: inputMax });
			} else {
				//input are illogical, set them to the nearest logical pair
				if (beingChanged == "txtMin") {
					var newValues = { min: (inputMax - 1), max: inputMax };
					this.setState({ values: newValues });
					this.setState({ txtMinValue: newValues.min, txtMaxValue: newValues.max });
					this.handleChangeComplete(null, newValues);
				} else if (beingChanged == "txtMax") {
					var newValues = { min: inputMin, max: (inputMin + 1) };
					this.setState({ values: newValues });
					this.setState({ txtMinValue: newValues.min, txtMaxValue: newValues.max });
					this.handleChangeComplete(null, newValues);
				}
			}
		} else {
			//input was out of bounds, set them to the bounds
			var newValues = { min: inputMin, max: inputMax };
			if (inputMin < this.props.minValue) {
				newValues.min = this.props.minValue;
			}
			if (inputMax > this.props.maxValue) {
				newValues.max = this.props.maxValue;
			}
			this.setState({ values: newValues });
			this.setState({ txtMinValue: newValues.min, txtMaxValue: newValues.max });
			this.handleChangeComplete(null, newValues);
		}

	}
	
	render() {
		return (
			<div className="FacetBlock RangeBlock">
				<h2 className="rangeblock-title">{this.props.title}</h2>
				<InputRange
					minValue={this.props.minValue}
					maxValue={this.props.maxValue}
					value={20}
					onChange={this.handleValuesChange.bind(this)}
					onChangeComplete={this.handleChangeComplete.bind(this)}
					/>

				<div className="rangeblock-range-input">
					<div className="rangeblock-form">
						<div className="rangeblock-input">
							<input
								className="rangeblock-textbox"
								id="txtMin"
								value={this.state.txtMinValue}
								onKeyDown={this.handleInputKeypress.bind(this)}
								onChange={this.handleInputChange.bind(this)}
								onBlur={this.handleInputBlur.bind(this)}
								type="text"
								/>
						</div>
					</div>
					<i className="fa fa-arrow-left arrow" aria-hidden="true"></i>
					<i className="fa fa-arrow-right arrow" aria-hidden="true"></i>
					<div className="rangeblock-form">
						<div className="rangeblock-input">
							<input
								className="rangeblock-textbox"
								id="txtMax"
								value={this.state.txtMaxValue}
								onKeyDown={this.handleInputKeypress.bind(this)}
								onChange={this.handleInputChange.bind(this)}
								onBlur={this.handleInputBlur.bind(this)}
								type="text"
								/>
						</div>
					</div>
				</div>

			</div>
		);
	}
}
