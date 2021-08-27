## Commands

Create Registry

```
az acr create --name PulumiMockRegistry --resource-group CCBSandbox --sku standard --admin-enabled true
```

Create Container

```
az acr build --registry PulumiMockRegistry --image pulumi-mock-image .
```

## References

- [Deploy Docker Image to App Service](https://github.com/pulumi/examples/blob/master/azure-ts-appservice-docker/index.ts)
- [Get Container Registry (Not okay - Use the @pulumi/azure_native package instead)](https://www.pulumi.com/docs/reference/pkg/azure/containerservice/getregistry/)
- [Upload React to Azure Storage Account](https://medium.com/bb-tutorials-and-thoughts/how-to-host-a-react-static-website-on-azure-438e0a915295)
- [GitHub Action Deploy React to Azure Storage](https://levelup.gitconnected.com/deploy-a-react-app-to-an-azure-blob-storage-using-github-actions-d56dc4b4724d)
- [Pulumi Static Website Using Azure Blob Storage and CDN](https://github.com/pulumi/examples/tree/master/azure-ts-static-website)
