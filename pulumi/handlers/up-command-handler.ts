import axios from 'axios';
import { remoteURL } from '../config';
import * as core from '@actions/core';

interface UpCommandParams {
  appName: string;
  endpoint: string;
}

export const upCommandHandler = ({ appName, endpoint }: UpCommandParams) => {
  core.exportVariable('REACT_APP_REMOTE_ENDPOINT', endpoint);

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
