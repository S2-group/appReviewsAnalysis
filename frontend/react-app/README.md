This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Quick Start
Prerequisites: Node.js

- Run `npm install` to install all required node packages
- Run `npm start` to start the dev server, which runs at http://localhost:3000
- To allow the front-end to connect to the server, `server.js` from the server folder also needs to be running. By default, all API calls from within the
development environment are proxied to http://localhost:6700. This can be changed in the `package.json`.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.
The development page proxies its requests to [http://localhost:6700]. This can be configured in the `package.json`.

### `npm run build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
The `build` folder can then be copy and pasted into the `build` folder in the server, which will serve it from its port.

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

