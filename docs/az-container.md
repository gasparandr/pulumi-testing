Create Registry

```
az acr create --name PulumiMockRegistry --resource-group CCBSandbox --sku standard --admin-enabled true
```

Create Container

```
az acr build --registry PulumiMockRegistry --image pulumi-mock-image .
```

References

- [Deploy Docker Image to App Service](https://github.com/pulumi/examples/blob/master/azure-ts-appservice-docker/index.ts)
- [Get Container Registry](https://www.pulumi.com/docs/reference/pkg/azure/containerservice/getregistry/)
