# appReviewsAnalysis front-end 

A React-based GUI built on top of the Python-based AppReviewAnalysis classification pipeline.

## UI Summary

#### Configuration view
![Configuration View](https://github.com/S2-group/appReviewsAnalysis/blob/master/frontend/img/config.jpg?raw=true)

The configuration view is the main view of the application. It consists of two columns: the left column is used for data entry, and the right column is used for the pipeline configuration.

The data entry column contains two similar input boxes. The first of the two allows the user to choose or upload an unlabeled data file, and the second allows the user to select or upload a manually labeled data file. The choice of data source can be made through the use of the tab controls.

The configuration column sequentially contains a box for every step of the classification pipeline. They allow the user to choose pre-processing options, the feature extraction method, the classification algorithms that will be used, and the testing parameters such as the train/test split and the number of folds. Plugins are shown in the classification box, marked by an icon.

The `Classify` button starts the classification process using the configured parameters.

#### Results view
![Results View](https://github.com/S2-group/appReviewsAnalysis/blob/master/frontend/img/results.jpg?raw=true)

The results view is shown when the classification process is finished. It consists of two main parts: the **overview**, and the **comparison**. 
The **overview** contains a separate box for every classification algorithm that was used. It shows average stats such as the _precision_ and the _recall_ over all classified labels, for each classification algorithm.

The **comparison** part contains two identical tab containers. Each tab container has a tab for every used classification algorithm, allowing the user to display the details of two classification algorithms side by side. These details consist of a frequency graph that shows the distribution of the frequency of all labels, and a detail table. This table contains detailed statistics on every label, and can be sorted by any of these values.

Pressing `OK` brings the user back to the configuration view.

## Server Installation
Prerequisites: Node.js and Python

The steps to install and run the server are as follows:
- Navigate to the `/frontend/server/` folder of this repository.
- `npm install` inside that folder to install the required node packages
- `pip install -r requirements.txt` inside that folder to install all required Python packages
- `node server.js` to run the server, which by default will run on http://localhost:6700/

The server also hosts a build of the React GUI on the root of http://localhost:6700/

For more information about how to build and run the development server of the GUI, see the `README.md` in the `/frontend/react-app/` folder.


## Notes
- `server.js` contains several configurable options, such as the port the server runs on and the path of the Python classification script