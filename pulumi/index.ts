import * as pulumi from '@pulumi/pulumi';
import * as storage from '@pulumi/azure-native/storage';
import * as web from '@pulumi/azure-native/web';
import axios from 'axios';

enum PulumiCommand {
  Up = 'up',
  Destroy = 'destroy',
}

const resourcePrefix = `ccb${process.env.BRANCH_NAME}`
  .toLocaleLowerCase()
  .replace(/[^a-zA-Z0-9]/g, '');

const resourceGroupName = 'CCBSandbox';

const remoteURL = 'https://sls-neur-dev-cloud-state.azurewebsites.net';

const plan = new web.AppServicePlan(`${resourcePrefix}plan`, {
  resourceGroupName,
  kind: 'Linux',
  reserved: true,
  sku: {
    name: 'B1',
    tier: 'Basic',
  },
});

const dockerImage = 'mcr.microsoft.com/oss/nginx/nginx:1.15.5-alpine';

const appService = new web.WebApp(`${resourcePrefix}app`, {
  resourceGroupName,
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

export const helloEndpoint = pulumi.interpolate`https://${appService.defaultHostName}`;

// Create an Azure resource (Storage Account)
const storageAccount = new storage.StorageAccount(`${resourcePrefix}sa`, {
  resourceGroupName,
  sku: {
    name: storage.SkuName.Standard_LRS,
  },
  kind: storage.Kind.StorageV2,
});

// Export the primary key of the Storage Account
const storageAccountKeys = pulumi
  .all([resourceGroupName, storageAccount.name])
  .apply(([resourceGroupName, accountName]) =>
    storage.listStorageAccountKeys({ resourceGroupName, accountName })
  );

export const primaryStorageKey = storageAccountKeys.keys[0].value;

pulumi.all([helloEndpoint, appService.name]).apply(([endpoint, appName]) => {
  if (pulumi.runtime.isDryRun()) {
    console.log('Pulumi dry run detected, aborting execution.');
    return;
  }

  switch (process.env.PULUMI_COMMAND) {
    case PulumiCommand.Up:
      console.log(`Pulumi command '${process.env.PULUMI_COMMAND}' detected.`);

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

      break;

    case PulumiCommand.Destroy:
      console.log(`Pulumi command '${process.env.PULUMI_COMMAND}' detected.`);
      break;

    default:
      console.error(
        `Pulumi command '${process.env.PULUMI_COMMAND}' not recognized. Aborting.`
      );
      return;
  }
});
