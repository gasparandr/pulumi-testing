export default {
  resourcePrefix: `ccb${process.env.BRANCH_NAME || 'local-test'}`
    .toLocaleLowerCase()
    .replace(/[^a-zA-Z0-9]/g, ''),
  resourceGroupName: 'CCBSandbox',
  remoteURL: 'https://sls-neur-dev-cloud-state.azurewebsites.net',
  dockerImage: 'mcr.microsoft.com/oss/nginx/nginx:1.15.5-alpine',
};
