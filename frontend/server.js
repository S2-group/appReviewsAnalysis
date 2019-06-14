const express = require('express');
var bodyParser = require("body-parser");
const path = require('path');
const fs = require('fs')
const app = express();
var server = require('http').Server(app);
let {PythonShell} = require('python-shell');

// ---------- CONFIG ----------
const PORT = process.env.PORT || 6700;
const DEV_ENV_ADDR = "http://localhost:3000"; // To allow cross origin requests
const REQ_SIZE_LIMIT = 100000; // kb

const PYTHON_PATH = "python";
const SCRIPT_ROOT = "./appReviewsAnalysis-master/analysis";
const PLUGIN_FOLDER = "./appReviewsAnalysis-master/analysis/plugins";
const DATASETS_FOLDER = "./datasets";

var NUM_CLASSIFICATION_OPTIONS = 7; // This is a default, will be updated during runtime
var NUM_PREPROC_OPTIONS = 3; // This is a default, will be updated during runtime
// ----------------------------

server.listen(PORT);
console.log("Listening on port " + PORT + "...");
server.timeout = 1000 * 60 * 10; // 10 minutes

app.use(bodyParser.json({limit: (REQ_SIZE_LIMIT+"kb")})); 
app.use(bodyParser.urlencoded({ limit: (REQ_SIZE_LIMIT+"kb"), extended: true, parameterLimit: REQ_SIZE_LIMIT }));

// Use middleware to set the default Content-Type
// app.use(function (req, res, next) {
//     //res.header('Content-Type', 'application/json');
//     //res.header('Access-Control-Allow-Origin', DEV_ENV_ADDR);
//     //res.header('Access-Control-Allow-Headers', 'Content-Type');
//     next();
// });

app.use(express.static(path.join(__dirname, 'build')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// getoptions will be called on pageload on the client
app.get('/api/getoptions', (req, res) => {
    // PyShell configuration
    let options = {
        mode: 'text',
        pythonPath: PYTHON_PATH,
        pythonOptions: ['-u'], // get print results in real-time
        scriptPath: SCRIPT_ROOT,
        args: ['-i', '-p', PLUGIN_FOLDER]
    };

    // UI config that will contain all options that the python script has
    var uiConfig = {
        "preprocessing":[],
        "featureExtraction":[{label: "None", name: "NONE"}],
        "classification":[],
        "datasets":[],
        "plugins":[]
    };

    console.log("Getting config...");

    // Read all datasets from the dataset folder and put them in the config
    fs.readdirSync(DATASETS_FOLDER).map((file)=>{
        uiConfig.datasets.push(file);
    });

    let pyshell = new PythonShell('classification.py', options); // Create PythonShell Instance

    pyshell.on('message', function (message) {
        if (message.startsWith("-")){ // Parse the default functionality
            // Message example: - Features extraction: Bi-grams, Tri-grams (NGRAMS, NGRAMS)
            var splitLine = message.substr(2).split(":");
            var type = splitLine[0];
            var configLabels = splitLine[1].split("(")[0].split(",");
            configLabels = configLabels.map(label=>label.trim());
            var configNames = splitLine[1].split("(")[1].split(",");
            configNames = configNames.map(name=>name.replace(")","").trim());

            switch (type) {
                case "Classifiers":
                    configLabels.map((item, i)=>{
                        uiConfig.classification.push({label: item, name: configNames[i]});
                    });
                    break;
                case "Preprocessing":
                    configLabels.map((item, i)=>{
                        uiConfig.preprocessing.push({label: item, name: configNames[i]});
                    });
                    break;
                case "Features extraction":
                    configLabels.map((item, i)=>{
                        uiConfig.featureExtraction.push({label: item, name: configNames[i]});
                    });
                    break;
            
                default:
                    break;
            }
        }else if (message.startsWith("+")){ // Parse the plugins
            // Message example: + my_plugin.py
            var pluginName = message.substr(2).split(".")[0];
            uiConfig.plugins.push(pluginName);
        }
    })

    pyshell.end(function(err,code,signal){
        // Done receiving messages from the python script
        if (err) throw err;
        console.log("Sending config...", uiConfig);    
        NUM_CLASSIFICATION_OPTIONS = uiConfig.classification.length;
        NUM_PREPROC_OPTIONS = uiConfig.preprocessing.length;
        console.log("Classification options: ", NUM_CLASSIFICATION_OPTIONS, "PreProc options:", NUM_PREPROC_OPTIONS);
        res.send(uiConfig);
        res.end();
    });
    
})


app.post('/api/classify', (req, res) => {
    var msgID = 0; // Used for SSE messages

    var initData = {labels: [], numLabeled: 0, numUnlabeled: 0}; // Will be sent to the client as soon as it's ready
    var resultData = {lines: []}

    // Prepare configs for the binary 0,1,0,0 format
    var classificationConfig = [];
    for (var i = 0; i < NUM_CLASSIFICATION_OPTIONS; i++)
        // If the classification object has an element with an index corresponding to this i, push 1, otherwise push 0.
        classificationConfig.push((req.body.classification.some(e => e.index == i)) ? "1" : "0");

    var preProcConfig = [];
    for (var i = 0; i < NUM_PREPROC_OPTIONS; i++)
        // If the preprocessing object has an element with an index corresponding to this i, push 1, otherwise push 0.
        preProcConfig.push((req.body.preprocessing.some(e => e.index == i)) ? "1" : "0");

    var pluginsConfig = [];
    req.body.plugins.map((plugin)=>{
        pluginsConfig.push(plugin.name);
    });

    // PyShell configuration
    let options = {
        mode: 'text',
        pythonPath: PYTHON_PATH,
        pythonOptions: ['-u'], // get print results in real-time
        scriptPath: SCRIPT_ROOT,
        args: [
            '-s',
            '-classifiers', classificationConfig.join(), // Join the array as a comma separated list (0,1,0)
            '-pre', preProcConfig.join(), 
            '-param', req.body.trainsize + ',' + req.body.splits + ',' + req.body.repeats, 
            '-extraction', req.body.featureExtraction.index, // This is either 0, 1 or 2, which corresponds with the index of the option
        ]
    };

    // If any plugins are selected, add the required plugin arguments to the PyShell config
    if (pluginsConfig.length > 0) 
        options.args = options.args.concat(['-plugins', pluginsConfig.join(), '-plugins_path', PLUGIN_FOLDER]);
  
    console.log("Running python worker with the options", options);

    let pyshell = new PythonShell('classification.py', options);

    // If the file was local for the client, we already have the contents in the HTTP request, otherwise read the dataset from the presets
    var rawString = (req.body.rawData.type == "local") ? 
        req.body.rawData.content : 
        fs.readFileSync(DATASETS_FOLDER + "/" + req.body.rawData.content);

    var classifiedString = (req.body.classifiedData.type == "local") ? 
        req.body.classifiedData.content : 
        fs.readFileSync(DATASETS_FOLDER + "/" + req.body.classifiedData.content);

    // Write our data to the Python process
    pyshell.childProcess["stdin"].write(classifiedString + "___xxx___" + rawString, ()=>{
        console.log("Finished Writing");
    });
    // Catch a write error, usually when the client aborts the request during the writing of the data
    pyshell.childProcess["stdin"].on("error", ()=>{
        console.log("Process ended prematurely");
    });
    
    // SSE response config
    res.status(200).set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-transform',
        'Connection': 'keep-alive',
    });

    // Initial SSE message
    res.write('\n');
    res.write(`id: ${msgID}\n`); msgID += 1;
    res.write(`event: open\n`);
    res.write(`data: na\n\n`);

    // Handles when the user aborts the request during execution
    req.on('close', function (err){
       console.log("Client aborted request...");
       pyshell.terminate();
       console.log("PyShell terminated");
       res.end();
       console.log("Response ended");
    });

    // Handles when the PyShell process is terminated (either naturally or through a signal)
    pyshell.end(function(err,code,signal){
        if (err) {
            console.log("Python error occured:", err);
            // Send the client one last message so it can display the python error
            res.write(`id: ${msgID}\n`); msgID += 1;
            res.write('event: pyerr\n');
            res.write(`data: ${JSON.stringify({err})}\n\n`);
            res.end();
            return;
        }
        console.log("Finished execution with signal:", signal);
        if (signal == "SIGTERM") {res.end(); return} // Process was terminated, so we have no results
        res.write(`id: ${msgID}\n`); msgID += 1;
        res.write('event: done\n');
        res.write(`data: ${JSON.stringify({resultData})}\n\n`); // resultData is an array consisting of messages collected during execution
        res.end();
    });

    // Handles when the PyShell produces stdout output (print statements)
    pyshell.on('message', function (message) {
        console.log("[PYTHON] " + message);

        // Check if the message starts with any of our labels. If it does, its a result line
        if (initData.labels){
            initData.labels.map((label, i)=>{
                if (message.trim().startsWith(label)){
                    var splitRow = message.trim().split(/\s+/); // Split on whitespaces
                    var tableRow = {
                        label: splitRow[0],
                        class: splitRow[1],
                        count: splitRow[2],
                        f1: splitRow[3],
                        prec: splitRow[4],
                        rec: splitRow[5],
                        testacc: splitRow[6],
                        auc: splitRow[7],
                        predPos: splitRow[8],
                        predNeg: splitRow[9]
                    };
                    resultData.lines.push(tableRow);

                    // Send SSE containing the progress, calculated by the amount of result lines vs the total amount of result lines that will come
                    res.write(`id: ${msgID}\n`); msgID += 1;
                    res.write(`data: ${JSON.stringify(
                        {
                            type: 'progress', 
                            data: Math.round((resultData.lines.length/(initData.labels.length * (req.body.classification.length + req.body.plugins.length)))*100)
                        }
                    )}\n\n`);
                }
            });
        }
        
        // Parse initialisation data
        if (message.startsWith('Labels')){
            // Remove the brackets, take the part after the ':', trim all whitespaces, split at commas
            initData.labels = message.replace(/[\[\]\']/g, "").split(":")[1].trim().split(",");
            initData.labels = initData.labels.map(label => label.trim());
            return;
        }else if(message.startsWith('Labeled file')){
            initData.numLabeled = parseInt(message.split(":")[1].trim().split(" ")[0]);
            return;
        }else if(message.startsWith('Unlabeled file')){
            initData.numUnlabeled = parseInt(message.split(":")[1].trim().split(" ")[0]);
            // This is the last entry of init data the script prints, so send it off to the client
            res.write(`id: ${msgID}\n`); msgID += 1;
            res.write(`data: ${JSON.stringify({type: 'init', data: initData})}\n\n`);
            return;
        }

        // If the message type is undefined, just send it to the client
        res.write(`id: ${msgID}\n`); msgID += 1;
        res.write(`data: ${JSON.stringify({type: 'message', data: message})}\n\n`);
    });

})