import React, { Component } from 'react';
import axios from 'axios';
import SSE from"./sse.js";
import './App.css';
import 'react-input-range/lib/css/input-range/input-range.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCog, faDatabase, faClipboardCheck, faClipboardList, faShapes, faProjectDiagram, faTable, faPlay, faSlidersH, faPuzzlePiece } from '@fortawesome/free-solid-svg-icons'

import Modal from './components/Modal/Modal.js';
import Spinner from './components/Spinner/Spinner.js';
import InputRange from 'react-input-range';

import DataSelector from './components/DataSelector/DataSelector.js';
import ResultView from './components/ResultView/ResultView.js';
import ProgressView from './components/ProgressView/ProgressView.js';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      labeledTab: 0,
      rawTab: 0,
      preProcessing: [],
      featureExtraction: "",
      classification: [],
      plugins: [],
      trainsize: 80,
      splits: 5,
      repeats: 10,
      options: null,
      running: false,
      labels: null,
      result: null,
      progress: 0,
      SSE: null,
      error: null,
      UIerror: "",
      rawPreset: "",
      labeledPreset: "",
      rawFile: null,
      labeledFile: null
    };
  }

  componentDidMount(){
    axios.get('/api/getoptions')
    .then(response => {

      // Pre-select the first option from the classifiers list
      if (response.data.classification[0]){
        var classif = this.state.classification.concat({index: 0, name: response.data.classification[0].name});
        this.setState({classification: classif});
      }

      // Pre-select the first option from the Feature Extraction list
      if (response.data.featureExtraction[0]){
        this.setState({featureExtraction: {index: 0, name: response.data.featureExtraction[0].name}});
      }

      this.setState({options: response.data});
    });
  }

  handlePreProcessClick = (val, e) => {
    if (this.state.preProcessing.some(e => e.index === val.index)) {
      // option already selected, so deselect it
      this.setState({preProcessing: this.state.preProcessing.filter(item => item.index !== val.index)});
    }else{
       // option not yet selected
      this.setState({preProcessing: [...this.state.preProcessing, val]});
    }
  }

  handleClassificationClick = (val, e) => {
    if (this.state.classification.some(e => e.index === val.index)) {
      // option already selected, so deselect it
      this.setState({classification: this.state.classification.filter(item => item.index !== val.index)});
    }else{
       // option not yet selected
      this.setState({classification: [...this.state.classification, val]});
    }
  }

  handlePluginClick = (val, e) => {
    if (this.state.plugins.some(e => e.index === val.index)) {
      // option already selected, so deselect it
      this.setState({plugins: this.state.plugins.filter(item => item.index !== val.index)});
    }else{
       // option not yet selected
      this.setState({plugins: [...this.state.plugins, val]});
    }
  }

  handleFeaturesClick = (index, e) => {
    this.setState({ featureExtraction: {index: index, name: e.target.value} });
  }

  onSplitsChange = (e) => {
    // Reject any characters that are not numeric while allowing empty string
    if (/^\d+$/.test(e.target.value) || e.target.value === ""){
      this.setState({splits: e.target.value});
    }
  }

  startClassification = (rawFile, labeledFile) => {
    // Create post request for the SSE connection
    const sseSource = new SSE('/api/classify', {
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      payload: JSON.stringify({
        preprocessing: this.state.preProcessing,
        featureExtraction: this.state.featureExtraction,
        classification: this.state.classification,
        rawData: rawFile,
        classifiedData: labeledFile,
        trainsize: this.state.trainsize/100, //convert from percentage
        splits: this.state.splits,
        repeats: this.state.repeats,
        plugins: this.state.plugins
      }),
      method: 'POST'
    });
  
    this.setState({ SSE: sseSource });

    // SSE Message listener
    sseSource.addEventListener('message', (e) => {
      const data = JSON.parse(e.data);
      switch (data.type) {
        case 'init':
          // Received initialisation data (labels)
          this.setState({ labels: data.data.labels });
          break;

        case 'progress':
          // Received progess update
          this.setState({ progress: data.data });
          break;

        default:
          break;
      }
    });

    // SSE connection open listener
    sseSource.addEventListener('open', (e) => {
      this.refs['modalProgress'].show();
      this.setState({ running: true, progress: 0, labels: null, error: null });
    })

    // SSE error listener
    sseSource.addEventListener('error', (e) => {
      console.log("CLOSED CONNECTION:", e);
      this.refs['modalProgress'].hide();
      this.setState({ running: false });
    })

    // SSE Python error listener
    sseSource.addEventListener('pyerr', (e) => {
      this.setState({ error: e.data });
      this.refs['modalProgress'].hide();
      this.refs['modalError'].show();
      this.setState({ running: false });
    })

    // SSE finished listener
    sseSource.addEventListener('done', (e) => {
      this.setState({ running: false });
      var rawData = JSON.parse(e.data);
      var classifiers = [];

      // Group data by classifier
      rawData.resultData.lines.forEach((item, i) => {
        if (!classifiers.some((elem) => {
          if (elem.name === item.class) {
            elem.values.push(item);
            return true;
          } else {
            return false;
          }
        })) {
          classifiers.push({ name: item.class, values: [item] });
        }
      });

      // Add average statistics to every classifier
      classifiers.forEach((classifier)=>{
        var sumPrec = 0, sumRec = 0, sumAcc = 0;
        classifier.values.forEach((value,i)=>{
          sumPrec += parseFloat(value.prec);
          sumRec += parseFloat(value.rec);
          sumAcc += parseFloat(value.testacc);
          classifier.values[i].predPos = parseInt(classifier.values[i].predPos); 
        });
        classifier['prec'] = sumPrec/classifier.values.length;
        classifier['rec'] = sumRec/classifier.values.length;
        classifier['acc'] = sumAcc/classifier.values.length;
      });
      this.setState({ result: classifiers });
    })

    sseSource.stream();
  }

  onClassifyClick = () => {
    // Basic form check
    if (this.state.classification.length + this.state.plugins.length < 1 ){
      this.setState({UIerror: <span>No <b>classifiers</b> selected</span>});
      return;
    }

    if (this.state.trainsize < 1 || this.state.trainsize > 100){
      this.setState({UIerror: <span><b>Train/Test Split</b> should be between <b>1</b> and <b>100</b></span>});
      return;
    }

    if (this.state.splits < 1){
      this.setState({UIerror: <span><b>Folds</b> should be at least <b>1</b></span>});
      return;
    }

    if (this.state.splits > 999){
      this.setState({UIerror: <span><b>Folds</b> should be <b>less</b> than <b>1000</b></span>});
      return;
    }

    if (this.state.repeats < 1 || this.state.repeats > 50){
      this.setState({UIerror: <span><b>Repeats</b> should be between <b>1</b> and <b>50</b></span>});
      return;
    }
    
    if ((this.state.rawTab === 0 && this.state.rawPreset === "") || (this.state.rawTab === 1 && !this.state.rawFile)){
      this.setState({UIerror: <span>Select or upload a <b>raw input</b> dataset</span>});
      return;
    }

    if ((this.state.labeledTab === 0 && this.state.labeledPreset === "") || (this.state.labeledTab === 1 && !this.state.labeledFile)){
      this.setState({UIerror: <span>Select or upload a <b>labeled input</b> dataset</span>});
      return;
    }

    // Reading the files
    this.setState({UIerror: ""});

    var rawFile = {type: "", content: null};
    var labeledFile = {type: "", content: null};

    var loadLabeledFile = () => {
      if (this.state.labeledTab === 0) { // The labeled file is from a preset
        labeledFile = {type: "preset", content: this.state.labeledPreset};
        this.startClassification(rawFile, labeledFile);
      }else{ // The labeled file is local
        var reader = new FileReader();
        reader.readAsText(this.state.labeledFile);
        reader.onload = (fileEvent) => {
          labeledFile = {type: "local", content: fileEvent.target.result};
          this.startClassification(rawFile, labeledFile);
        };
      }
    }
    
    if (this.state.rawTab === 0) { // The raw file is from a preset
      rawFile = {type: "preset", content: this.state.rawPreset};
      loadLabeledFile();
    }else{ // The raw file is local
      var reader = new FileReader();
      reader.readAsText(this.state.rawFile);
      reader.onload = (fileEvent) => {
        rawFile = {type: "local", content: fileEvent.target.result}
        loadLabeledFile();
      };
    }

  }

  render() {

    return (
      <div className="App">
        <header className="App-header">
          <div><span style={{color: "gray"}}>Review</span> Analysis</div>
        </header>

        <Modal ref="modalProgress" title="Classification" stop={true} handleStopClick={()=>{this.refs['modalProgress'].hide(); this.setState({running:false}); this.state.SSE.close()}}>
          <ProgressView
            labels={this.state.labels}
            running={this.state.running}
            progress={this.state.progress}
            result={this.state.result}
            showResultsFunction={()=>{this.refs['modalProgress'].hide(); this.refs['modalResult'].show();}}
          />
				</Modal>

        <Modal ref="modalResult" title="Results" ok={true} wide={true}>
          <ResultView result={this.state.result}/>
        </Modal>

        <Modal ref="modalError" title="Error occured" ok={true}>
          {this.state.error?<pre style={{textAlign:'left'}}>{(JSON.parse(this.state.error)).err.traceback}</pre>:null}
        </Modal>

        <div className="App-body">
          
          <div className="col col1">
            <div className="col-title"><FontAwesomeIcon icon={faDatabase} /> Data</div>

            <div className="data-input block">
              <div className="block-title"><FontAwesomeIcon icon={faClipboardList} /> Raw Input <span className="help-button"></span></div>
              <DataSelector 
                datasets={(this.state.options)?this.state.options.datasets:null} 
                onSetPreset={(dataset)=>{this.setState({rawPreset: (this.state.rawPreset === dataset)?"":dataset})}}
                onTabChange={(index)=>{this.setState({rawTab: index})}}
                onFileChange={(e)=>{this.setState({rawFile: e.target.files[0]})}}
                preset={this.state.rawPreset}
              />                       
            </div>

            <div className="classified-input block">
              <div className="block-title"><FontAwesomeIcon icon={faClipboardCheck} /> Labeled Input</div>       
              <DataSelector 
                datasets={(this.state.options)?this.state.options.datasets:null} 
                onSetPreset={(dataset)=>{this.setState({labeledPreset: (this.state.labeledPreset === dataset)?"":dataset})}}
                onTabChange={(index)=>{this.setState({labeledTab: index})}}
                onFileChange={(e)=>{this.setState({labeledFile: e.target.files[0]})}}
                preset={this.state.labeledPreset}
              />
            </div>

          </div>

          <div className="col col2">
            <div className="col-title"><FontAwesomeIcon icon={faCog} /> Configuration</div>

            <div className="config-block block block-max">
              <div className="block-title"><FontAwesomeIcon icon={faTable} /> Preprocessing</div>
              {(this.state.options)? this.state.options.preprocessing.map((item, i) => {
                return(
                  <div key={i} className="config-option">
                    <label>
                      <input type="checkbox" className="option-checkbox" checked={this.state.preProcessing[item.name]} onChange={(e) => this.handlePreProcessClick({index: i, name: item.name}, e)} />
                      <span className="option-label">{item.label}</span>
                    </label>
                  </div>
                )
              }):<div className="center"><Spinner/></div>}
            </div>

            <div className="config-block block block-max">
              <div className="block-title"><FontAwesomeIcon icon={faProjectDiagram} /> Feature Extraction</div>

              {(this.state.options)? this.state.options.featureExtraction.map((item, i) => {
                return(
                  <div key={i} className="config-option">
                    <label>
                      <input type="radio" name="features" value={item.name} className="option-checkbox" checked={this.state.featureExtraction.index === i} onChange={(e) => this.handleFeaturesClick(i, e)} />
                      <span className="option-label">{item.label}</span>
                    </label>  
                  </div>
                )
              }):<div className="center"><Spinner/></div>}
            </div>

            <div className="config-block block block-max">
              <div className="block-title"><FontAwesomeIcon icon={faShapes} /> Classification</div>

              {(this.state.options)? this.state.options.classification.map((item, i) => {
                return(
                  <div key={i} className="config-option">
                    <label>
                      <input type="checkbox" className="option-checkbox" checked={this.state.classification.some(e => e.index === i)} onChange={(e) => this.handleClassificationClick({index: i, name: item.name}, e)} />
                      <span className="option-label">{item.label}</span>
                    </label>
                  </div>
                )
              }):<div className="center"><Spinner/></div>}

              {(this.state.options)? this.state.options.plugins.map((item, i) => {
                return(
                  <div key={i} className="config-option">
                    <label>
                      <input type="checkbox" className="option-checkbox" checked={this.state.plugins.some(e => e.index === i)} onChange={(e) => this.handlePluginClick({index: i, name: item}, e)} />
                      <span className="option-label">{item}<FontAwesomeIcon icon={faPuzzlePiece} /></span>
                    </label>
                  </div>
                )
              }):null}
            </div>

            <div className="config-block block block-max">
              <div className="block-title"><FontAwesomeIcon icon={faSlidersH} /> Parameters</div>
              {(this.state.options)?
              <div className="RangeBlock">
                <div className="param-group">
                <div className="param-group-title">Train/Test Split</div>
                  <div className="param">
                    <div className="param-slider">
                      <InputRange
                        minValue={0}
                        maxValue={100}
                        step={1}
                        value={Math.round(this.state.trainsize*10)/10}
                        onChange={(value)=>{this.setState({trainsize:value})}}
                      />
                    </div>
                  </div>
                </div>
                <div className="param-group">
                  <div className="param-group-title">Cross Validation</div>
                  <div className="param">
                    <span className="param-label">Folds</span>
                    <input className="param-input" name="splits" onChange={this.onSplitsChange} value={this.state.splits}></input>
                  </div>
                  <div className="param">
                    <span className="param-label">Repeats</span>
                    <div className="param-slider labeled">
                      <InputRange
                        minValue={1}
                        maxValue={50}
                        value={this.state.repeats}
                        onChange={(value)=>{this.setState({repeats:value})}}
                      />
                    </div>
                  </div>
                </div>
                
              </div>:<div className="center"><Spinner/></div>
              }
            </div>

            <div className="classify-button">
              <button onClick={this.onClassifyClick}><FontAwesomeIcon icon={faPlay} /> Classify</button>
            </div>

            <div className="ui-error">{this.state.UIerror}</div>

          </div>
          

        </div>
      </div>
    );
  }
}

export default App;
