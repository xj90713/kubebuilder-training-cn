# Webhook生成

Kubernetes 有一个名为`Admission Webhook` 的扩展。
该函数在创建或更新特定资源时调用`Webhook API`，并对资源进行验证或重写。

使用`kubebuilder`命令，您可以使用以下三个选项指定要生成的 Webhook。

- `--programmatic-validation`：用于资源验证的 Webhook
- `--defaulting`：用于设置资源字段默认值的Webhook。
- `--conversion`：用于在升级自定义资源时转换资源的 Webhook

在这里，我们指定 `--programmatic-validation` 和 `--defaulting` 来为 MarkdownView 资源生成 webhook。

注意: Kind 不能是现有资源，例如 Pod 或 Deployment。

```console
$ kubebuilder create webhook --group view --version v1 --kind MarkdownView --programmatic-validation --defaulting
$ make manifests
```

运行上面命令之后，新添加了以下文件。

```
├── api
│    └── v1
│        ├── markdownview_webhook.go
│        └── webhook_suite_test.go
└── config
     ├── certmanager
     │    ├── certificate.yaml
     │    ├── kustomization.yaml
     │    └── kustomizeconfig.yaml
     ├── default
     │    ├── manager_webhook_patch.yaml
     │    └── webhookcainjection_patch.yaml
     └── webhook
         ├── kustomization.yaml
         ├── kustomizeconfig.yaml
         ├── manifests.yaml
         └── service.yaml
```

## api/v1

`markdownview_webhook.go` 是 webhook 实现的模板。
我们将把 webhook 实现添加到该文件中

## config/certmanager

使用Admission Webhook功能需要证书。
已生成使用 [cert-manager][] 颁发证书的自定义资源。

## config/webhook

`config/webhook`是使用webhook功能所需的manifest文件。
Manifests.yaml文件是通过`make manifests`文件自动生成的，所以基本上不需要手动编辑。

## cmd/main.go

`cmd/main.go` 添加了代码来初始化 webhook，如下所示。

[import:"init-webhook",unindent="true"](../../codes/00_scaffold/cmd/main.go)

## kustomization.yaml编辑

使用 Kubebuilder 命令生成清单后，即使使用 make manifests 命令生成清单，Webhook 功能也将不可用。

`config/default/kustomization.yaml`需要编辑这个文件。

生成`kustomization.yaml`在`resources`中包含`../webhook`和`../certmanager`，`manager_webhook_patch.yaml`、`webhookcainjection_patch.yaml`和`patchesStrategicMerge`中的`replacements`被注释掉。取消注释这些。

[import:"resources,enable-webhook,patches,enable-webhook-patch,replacements"](../../codes/00_scaffold/config/default/kustomization.yaml)

[cert-manager]: https://github.com/jetstack/cert-manager
