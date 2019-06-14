import React, { Component } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileAlt } from '@fortawesome/free-solid-svg-icons';

import Spinner from '../Spinner/Spinner.js';

class DataSelector extends Component {

  constructor(props) {
    super(props);
    this.state = {
      tabIndex: 0
    }
  }

  static defaultProps = {
    datasets: [],
    onSetPreset: null,
    onTabChange: null,
    preset: ""
  }

  render() {
    return (
      <div className="tabs">
        <div className="tab-buttons">
          <span onClick={() => { this.setState({ tabIndex: 0 }); this.props.onTabChange(0); }} className={"tab-button " + (this.state.tabIndex === 0 ? " opened" : "")}>Preset Datasets</span>
          <span onClick={() => { this.setState({ tabIndex: 1 }); this.props.onTabChange(1); }} className={"tab-button " + (this.state.tabIndex === 1 ? " opened" : "")}>Upload Dataset</span>
        </div>

        <div className="tab-containers">
          <div className={"tab-container " + (this.state.tabIndex === 0 ? " opened" : "")}>
            <div className="datasets">
              <div className="datasets-container">
                {
                  (this.props.datasets) ? (this.props.datasets.map((dataset, i) => {
                    return (
                      <div key={i} className={"dataset " + ((this.props.preset === dataset) ? "selected" : "")} onClick={()=>{this.props.onSetPreset(dataset)}}>
                        <FontAwesomeIcon icon={faFileAlt} /> {dataset}
                      </div>
                    )
                  })) : <Spinner/>
                }
              </div>
            </div>
          </div>

          <div className={"tab-container " + (this.state.tabIndex === 1 ? " opened" : "")}>
            <input ref="fileInput" type="file" onChange={(e)=>{this.props.onFileChange(e)}}></input>
          </div>
        </div>

      </div>
    )
  }
}

export default DataSelector;