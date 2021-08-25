import * as pulumi from '@pulumi/pulumi';
import * as resources from '@pulumi/azure-native/resources';
import * as storage from '@pulumi/azure-native/storage';
import * as web from '@pulumi/azure-native/web';

// Create an Azure Resource Group
// const resourceGroup = new resources.ResourceGroup("resourceGroup");
const resourceGroup = { name: 'CCBSandbox' };

const plan = new web.AppServicePlan('PulumiPlan', {
  resourceGroupName: resourceGroup.name,
  kind: 'Linux',
  reserved: true,
  sku: {
    name: 'B1',
    tier: 'Basic',
  },
});

const dockerImage = 'mcr.microsoft.com/oss/nginx/nginx:1.15.5-alpine';

const helloApp = new web.WebApp('helloApp', {
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

export const helloEndpoint = pulumi.interpolate`https://${helloApp.defaultHostName}/hello`;

// Create an Azure resource (Storage Account)
const storageAccount = new storage.StorageAccount('sa', {
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
