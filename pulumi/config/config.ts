export const resourcePrefix = `ccb${process.env.BRANCH_NAME || 'local-test'}`
  .toLocaleLowerCase()
  .replace(/[^a-zA-Z0-9]/g, '');
export const resourceGroupName = 'CCBSandbox';
export const remoteURL = 'https://sls-neur-dev-cloud-state.azurewebsites.net';
// export const dockerImage = 'mcr.microsoft.com/oss/nginx/nginx:1.15.5-alpine';
export const dockerImage = 'pulumi-mock-image';
export const registryName = 'PulumiMockRegistry';
export const registryLoginServer = 'pulumimockregistry.azurecr.io';
