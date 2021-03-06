import * as pulumi from '@pulumi/pulumi';
import * as storage from '@pulumi/azure-native/storage';
import * as web from '@pulumi/azure-native/web';
import * as containerregistry from '@pulumi/azure-native/containerregistry';
import * as core from '@actions/core';

import { PulumiCommand } from './constants';
import { upCommandHandler, desstroyCommandHandler } from './handlers';
import {
  resourcePrefix,
  resourceGroupName,
  dockerImage,
  registryName,
} from './config';

const plan = new web.AppServicePlan(`${resourcePrefix}plan`, {
  resourceGroupName,
  kind: 'Linux',
  reserved: true,
  sku: {
    name: 'B1',
    tier: 'Basic',
  },
});

const registry = containerregistry.getRegistry({
  registryName,
  resourceGroupName,
});

const loginServer = registry.then((registry) => registry.loginServer);

const credentials = pulumi
  .all([resourceGroupName, registryName])
  .apply(([resourceGroupName, registryName]) =>
    containerregistry.listRegistryCredentials({
      resourceGroupName,
      registryName,
    })
  );

const adminUsername = credentials.apply((credentials) => credentials.username!);
const adminPassword = credentials.apply(
  (credentials) => credentials.passwords![0].value!
);

const appService = new web.WebApp(`${resourcePrefix}app`, {
  resourceGroupName,
  serverFarmId: plan.id,
  siteConfig: {
    appSettings: [
      {
        name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE',
        value: 'false',
      },
      {
        name: 'DOCKER_REGISTRY_SERVER_URL',
        value: pulumi.interpolate`https://${loginServer}`,
      },
      {
        name: 'DOCKER_REGISTRY_SERVER_USERNAME',
        value: adminUsername,
      },
      {
        name: 'DOCKER_REGISTRY_SERVER_PASSWORD',
        value: adminPassword,
      },
      {
        name: 'WEBSITES_PORT',
        value: '3000',
      },
    ],
    alwaysOn: true,
    linuxFxVersion: pulumi.interpolate`DOCKER|${loginServer}/${dockerImage}`,
  },
  httpsOnly: true,
});

export const helloEndpoint = pulumi.interpolate`https://${appService.defaultHostName}`;

// Create an Azure resource (Storage Account)
const storageAccount = new storage.StorageAccount(`${resourcePrefix}sa`, {
  enableHttpsTrafficOnly: true,
  resourceGroupName,
  sku: {
    name: storage.SkuName.Standard_LRS,
  },
  kind: storage.Kind.StorageV2,
});

// Enable static website support
const staticWebsite = new storage.StorageAccountStaticWebsite(
  `${resourcePrefix}sw`,
  {
    accountName: storageAccount.name,
    resourceGroupName,
    indexDocument: 'index.html',
    error404Document: '404.html',
  }
);

// Web endpoint to the website
export const staticEndpoint = storageAccount.primaryEndpoints.web;

// Export the primary key of the Storage Account
const storageAccountKeys = pulumi
  .all([resourceGroupName, storageAccount.name])
  .apply(([resourceGroupName, accountName]) => {
    core.exportVariable('AZURE_STORAGE_ACCOUNT_NAME', accountName);
    return storage.listStorageAccountKeys({ resourceGroupName, accountName });
  });

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
