import React, { Component } from 'react';

import Spinner from '../Spinner/Spinner.js';

class ProgressView extends Component {

  static defaultProps = {
    labels: [],
    running: false,
    progress: 0,
    result: [],
    showResultsFunction: null
  }

  render() {
    return (
      <div className="progress-view">

        <div className="extracted-labels">
          <div className="class-labels-title">{!this.props.labels ? <span>Extracting Labels <Spinner /></span> : <span>Extracted Labels <span style={{ color: "green" }}>&#10004;</span></span>}</div>
          <div className="class-labels">
            {
              this.props.labels ?
              this.props.labels.map((item, i) => {
                  return (<div key={i} className="class-label">{item}</div>)
                }) : ""
            }
          </div>
        </div>

        <div className="extracted-labels">
          <div className="class-labels-title">{this.props.running ? <span>Classifying Data <Spinner /></span> : <span>Completed Classification <span style={{ color: "green" }}>&#10004;</span></span>}</div>
          <div className={"meter " + (this.props.running ? "anim" : "")}>
            <span style={{ width: this.props.progress + "%" }}></span>
          </div>
        </div>

        {!this.props.running && this.props.result ?
          <div className="extracted-labels">
            <div className="class-labels-title">Results</div>
            <div className="results-button" onClick={this.props.showResultsFunction}>Show Results</div>
          </div> : null
        }

      </div>
    )
  }
}

export default ProgressView;