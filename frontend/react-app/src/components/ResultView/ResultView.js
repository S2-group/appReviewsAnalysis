import React, { Component } from 'react';
import ResultBox from '../ResultBox/ResultBox.js';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileExport } from '@fortawesome/free-solid-svg-icons';

class ResultView extends Component {
  
  static defaultProps = {
    result: []
  }

  render() {
    return (
      <div className="results">

        <div className="results-overview">
          <div className="section-title">Overview</div>
          {
            ((this.props.result) ? this.props.result.map((item, i) => {
              return (
                <div key={i} className="results-overview-col">
                  <div className="overview-col-title">{item.name}</div>
                  <div className="overview-col-items">
                    <div className="overview-col-item">
                      <span className="overview-col-label">Precision: </span><span className="overview-col-value">{Math.round(item.prec * 10000) / 10000}</span>
                    </div>
                    <div className="overview-col-item">
                      <span className="overview-col-label">Recall: </span><span className="overview-col-value">{Math.round(item.rec * 10000) / 10000}</span>
                    </div>
                    <div className="overview-col-item">
                      <span className="overview-col-label">Accuracy: </span><span className="overview-col-value">{Math.round(item.acc * 10000) / 10000}</span>
                    </div>
                  </div>
                </div>
              )
            }) : null)
          }
        </div>

        <div className="resultboxes">
          <div className="section-title with-button">
            <span>Compare Results </span>
            <a className="export-button button" download={"classification_results.json"} href={"data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.props.result))}><FontAwesomeIcon icon={faFileExport} /> Export</a>
          </div>
          
          <ResultBox result={this.props.result} />
          <ResultBox result={this.props.result} />
        </div>

      </div>
    )
  }
}

export default ResultView;