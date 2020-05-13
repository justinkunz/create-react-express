#! /usr/bin/env node
const { exec } = require("child_process");
const { readFileSync, writeFileSync } = require("fs");
const serverBoilerplate = require("./serverBoilerplate");
const ora = require("ora");

const init = async () => {
  let [, , projectName, PORT] = process.argv;

  if (!projectName) {
    throw "No project name specified";
  }

  if (PORT === 3000) {
    throw "Express port can not be 3000";
  }

  if (!PORT) PORT = 3001;

  const steps = [
    {
      label: `Creating ${projectName} folder`,
      cmd: `mkdir ${projectName}`,
    },
    {
      label: `Creating React App - Go grab a drink 🍻`,
      cmd: `cd ${projectName} && create-react-app client`,
    },
    {
      label: "Installing Server Depenancies",
      cmd: `cd ${projectName} && npm init -y && npm i express concurrently nodemon`,
    },
  ];

  for (step of steps) {
    await executeStep(step);
  }

  addToPackageContents(
    `Adding Proxy config on React package.json file to route traffic to port ${PORT}`,
    `./${projectName}/client/package.json`,
    { proxy: `http://localhost:${PORT}` }
  );

  addToPackageContents(
    "Adding Start script to server npm package",
    `./${projectName}/package.json`,
    {
      scripts: {
        start:
          "if-env NODE_ENV=production && npm run start:prod || npm run start:dev",
        "start:prod": "node server.js",
        "start:dev":
          'concurrently "nodemon --ignore \'client/*\'" "npm run client"',
        client: "cd client && npm run start",
      },
    }
  );

  writeFileSync(`./${projectName}/index.js`, serverBoilerplate(PORT));

  console.log(
    `🚀 Created React Express App in ${projectName}
    
    To start your app run:
    cd ${projectName}
    npm start
    `
  );
};

const executeStep = ({ label, cmd }) => {
  return new Promise((resolve, reject) => {
    const log = ora(label).start();
    exec(cmd, (err) => {
      if (err) reject(err);
      log.succeed();
      resolve();
    });
  });
};

const addToPackageContents = (label, packagePath, changes) => {
  const log = ora(label).start();
  const packageContents = JSON.parse(readFileSync(packagePath, "utf-8"));

  for (c in changes) {
    packageContents[c] = changes[c];
  }

  writeFileSync(packagePath, JSON.stringify(packageContents));
  log.succeed();
};
init();
