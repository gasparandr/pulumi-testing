import * as pulumi from '@pulumi/pulumi';
import * as storage from '@pulumi/azure-native/storage';
import * as web from '@pulumi/azure-native/web';

import { PulumiCommand } from './constants';
import { upCommandHandler, desstroyCommandHandler } from './handlers';
import { resourcePrefix, resourceGroupName, dockerImage } from './config';

const plan = new web.AppServicePlan(`${resourcePrefix}plan`, {
  resourceGroupName,
  kind: 'Linux',
  reserved: true,
  sku: {
    name: 'B1',
    tier: 'Basic',
  },
});

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

      upCommandHandler({ appName, endpoint });

      break;

    case PulumiCommand.Destroy:
      console.log(`Pulumi command '${process.env.PULUMI_COMMAND}' detected.`);

      desstroyCommandHandler();

      break;

    default:
      console.error(
        `Pulumi command '${process.env.PULUMI_COMMAND}' not recognized. Aborting.`
      );
      return;
  }
});
