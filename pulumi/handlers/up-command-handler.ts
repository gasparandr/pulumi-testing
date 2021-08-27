import axios from 'axios';
import { remoteURL } from '../config';
import { exec } from 'child_process';

interface UpCommandParams {
  appName: string;
  endpoint: string;
}

export const upCommandHandler = ({ appName, endpoint }: UpCommandParams) => {
  exec(
    `echo "::set-env name=APP_ENDPOINT::${endpoint}"`,
    (err: any, stdout: any, stderr: any) => {
      if (err) {
        //some err occurred
        console.error(err);
      } else {
        // the *entire* stdout and stderr (buffered)
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
      }
    }
  );

  axios
    .get(
      `${remoteURL}/api/createAppConfig?branchName=${process.env.BRANCH_NAME}&appName=${appName}`
    )
    .then((response) => {
      console.log('Response:', response.data);
      console.log('Branch name:', process.env.BRANCH_NAME);
      console.log('Hello endpoint:', endpoint);
      console.log('App service name:', appName);
    })
    .catch((error) => {
      console.log(error);
    });
};
