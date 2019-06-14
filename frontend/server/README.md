# appReviewsAnalysis front-end server

Server that hosts both the React based UI and the middle man that sits between the web UI and the Python based script.

## Installation
Prerequisites: Node.js and Python

Suggested steps to install required components and run the server:

- `npm install` inside this folder to install the required node packages
- `pip install -r requirements.txt` inside this folder to install all required Python packages
- `node server.js` to run the server, which by default will run on http://localhost:6700/


## Notes
- React builds that are made with the front-end development environment should be copy and pasted into the `build` folder, which is served by this server
- `server.js` contains several configurable options, such as the port the server runs on and the path of the Python classification script
