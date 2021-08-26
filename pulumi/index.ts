import * as pulumi from '@pulumi/pulumi';
import * as resources from '@pulumi/azure-native/resources';
import * as storage from '@pulumi/azure-native/storage';
import * as web from '@pulumi/azure-native/web';
import axios from 'axios';

const projectPrefix = 'CCB';
const resourcePrefix = `${projectPrefix}${process.env.BRANCH_NAME}`;
// Create an Azure Resource Group
// const resourceGroup = new resources.ResourceGroup("resourceGroup");
const resourceGroup = { name: 'CCBSandbox' };

const plan = new web.AppServicePlan(`${resourcePrefix}plan`, {
  resourceGroupName: resourceGroup.name,
  kind: 'Linux',
  reserved: true,
  sku: {
    name: 'B1',
    tier: 'Basic',
  },
});

const dockerImage = 'mcr.microsoft.com/oss/nginx/nginx:1.15.5-alpine';

const helloApp = new web.WebApp(`${resourcePrefix}app`, {
  resourceGroupName: resourceGroup.name,
  serverFarmId: plan.id,
  siteConfig: {
    appSettings: [
      {
        name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE',
        value: 'false',
      },
    ],
    alwaysOn: true,
    linuxFxVersion: `DOCKER|${dockerImage}`,
  },
  httpsOnly: true,
});

export const helloEndpoint = pulumi.interpolate`https://${helloApp.defaultHostName}`;

// Create an Azure resource (Storage Account)
const storageAccount = new storage.StorageAccount(`${resourcePrefix}sa`, {
  resourceGroupName: resourceGroup.name,
  sku: {
    name: storage.SkuName.Standard_LRS,
  },
  kind: storage.Kind.StorageV2,
});

// Export the primary key of the Storage Account
const storageAccountKeys = pulumi
  .all([resourceGroup.name, storageAccount.name])
  .apply(([resourceGroupName, accountName]) =>
    storage.listStorageAccountKeys({ resourceGroupName, accountName })
  );
export const primaryStorageKey = storageAccountKeys.keys[0].value;

pulumi.all([helloEndpoint, helloApp.name]).apply(([endpoint, appName]) => {
  console.log('Is pulumi dry run?: ', pulumi.runtime.isDryRun());

  if (pulumi.runtime.isDryRun()) return;

  console.log('BRANCH NAME inside PULUMI: ', process.env.BRANCH_NAME);

  axios
    .get('http://jsonplaceholder.typicode.com/posts?_limit=1')
    .then((response) => {
      // handle success
      console.log(response.data);
      console.log('Hello endpoint:', endpoint);
      console.log('App service name:', appName);
    })
    .catch((error) => {
      // handle error
      console.log(error);
    });
});
