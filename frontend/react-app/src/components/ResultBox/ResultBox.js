import React, { Component } from 'react';
import BarChart from '../BarChart/BarChart.js';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSort, faSortDown, faSortUp } from '@fortawesome/free-solid-svg-icons';

class ResultBox extends Component {

  constructor(props) {
    super(props);
    this.state = {
      openTab: 0,
      sorting: {property: "predPos", order: "desc"}
    };

  }

  static defaultProps = {
    result: []
  }

  componentDidUpdate(prevProps){
    if (JSON.stringify(prevProps) !== JSON.stringify(this.props)){
      // New props have been given so reset the state
      this.setState({openTab: 0});
    }
  }

  handleTabClick = (i) => {
    this.setState({ openTab: i });
  }

  setSorting = (property) => {
    var order = "asc"; // default sorting is ascending
    if (this.state.sorting.property === property) // already sorting this property, so flip the order
      order = (this.state.sorting.order === "desc")? "asc":"desc";
    
    this.setState({sorting:{property:property, order:order}});
  }

  dynamicSort = (property) => {
    var sortOrder = 1;
      if(property[0] === "-") {
          sortOrder = -1;
          property = property.substr(1);
      }
      return function (a,b) {
          var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
          return result * sortOrder;
      }
  }


  render() {
    var result = (this.props.result)?this.props.result:[];

    var highestCount = 0; // Used for determining the Y scale over All classifiers
    result.forEach((result) => {
      result.values.forEach((resultValue) => { // Loop through all labels of the classifier
        if (resultValue.predPos > highestCount) highestCount = resultValue.predPos; // Find highest predPos, for graph scaling
      });
    });

    var tableItems = [ // Predefined items to display in the details table
      {label: "Label", name: "label", align: "left"},
      {label: "Amount", name: "predPos", align: "right"},
      {label: "Precision", name: "prec", align: "left"},
      {label: "Recall", name: "rec", align: "left"},
      {label: "Accuracy", name: "testacc", align: "left"},
      {label: "F1", name: "f1", align: "left"}
    ];

    return (
      <div className="resultbox tabs">

        <div className="tab-buttons">
          {
            result.map((resultItem, i) => {
              return (
                <span key={i} className={"tab-button " + ((this.state.openTab === i)?"opened":"")} onClick={()=>{this.handleTabClick(i)}}>
                  {resultItem.name}
                </span>
              )
            })
          }
        </div>

        <div className="resultbox-content tab-containers">
          {
            result.map((result, classifierIndex) => { // Loop through all classifiers
              var barChartData = [];

              result.values.sort(this.dynamicSort((this.state.sorting.order === "desc"? "-":"") + this.state.sorting.property));

              result.values.forEach((resultValue) => { // Loop through all labels of the classifier and add them to the barchart data
                  barChartData.push({text: resultValue.label, value: parseInt(resultValue.predPos)});
              });

              barChartData.sort(this.dynamicSort("-value")); // Sort the graph by value, descendingly

              return (
                <div key={classifierIndex} className={"tab-container " + ((this.state.openTab === classifierIndex) ? "opened" : "")}>

                  <div className="barchart-view">
                    <div className="barchart">
                      <BarChart 
                        ylabel='Predicted amount'
                        width={450}
                        height={200}
                        margin={{top: 10, right: 10, bottom: 10, left: 10}}
                        data={barChartData}
                        maxWidth={26}
                        ymax={highestCount}
                      />
                    </div>
                  </div>

                  <div className="result-table">
                      <div className="result-table-row header">
                        {
                          tableItems.map((tableItem, i)=>{
                            var icon = faSort;
                            if (this.state.sorting.property === tableItem.name)
                              icon = (this.state.sorting.order === "desc")?faSortDown:faSortUp;
                            
                            return(
                              <div key={i} className="result-label">
                                {tableItem.label} <span className="sort-button" onClick={()=>{this.setSorting(tableItem.name)}}><FontAwesomeIcon icon={icon} /></span>
                              </div>
                            )
                          })
                        }
                      </div>

                      {
                        (result.values.map((resultLine, n)=>{
                          return(
                            <div key={n} className="result-table-row">
                              {tableItems.map((tableItem, i)=>{
                                  return(<div key={i} className={"result-" + (tableItem.align)}>{resultLine[tableItem.name]}</div>)
                                })}
                            </div>
                            );
                        }))
                      }
                  </div>

                </div>
              )


            })
          }
        </div>

      </div>
    )
  }
}

export default ResultBox;