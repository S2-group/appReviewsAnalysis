# appReviewsAnalysis front-end 

A React-based GUI built on top of the Python-based AppReviewAnalysis classification pipeline.

![Configuration View](https://i.imgur.com/DUIEXnA.jpg)

## UI Summary
The user interface consists of two columns. The left column is used for data entry, and the right column is used for the pipeline configuration.

The data entry column contains two similar input boxes. The first of the two allows the user to choose or upload an unlabeled data file, and the second allows the user to select or upload a manually labeled data file.

The configuration column sequentially contains a box for every step of the classification pipeline. They allow the user to choose pre-processing options, the feature extraction method, the classification algorithms that will be used, and the testing parameters. Plugins are shown in the classification box, marked by an icon.

The `Classify` button starts the classification process using the configured parameters.

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