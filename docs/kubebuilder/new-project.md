# 创建项目模版

使用`kubebuilder init`命令来生成项目模版。

```console
$ mkdir markdown-view
$ cd markdown-view
$ kubebuilder init --domain zoetrope.github.io --repo github.com/zoetrope/markdown-view
```

`--domain`中指定的名称用作CRD组的名称。
请使用您的组织内拥有的域指定唯一且有效的名称

`--repo`指定go模块的模块名称。
如果您想在`GitHub`上创建存储库，请指定 `github.com/<user_name>/<product_name>`。

如果命令执行成功，将会生成一个类似于下面的文件。

```
├── Dockerfile
├── Makefile
├── PROJECT
├── README.md
├── cmd
│    └── main.go
├── config
│    ├── default
│    │    ├── kustomization.yaml
│    │    ├── manager_auth_proxy_patch.yaml
│    │    └── manager_config_patch.yaml
│    ├── manager
│    │    ├── kustomization.yaml
│    │    └── manager.yaml
│    ├── prometheus
│    │    ├── kustomization.yaml
│    │    └── monitor.yaml
│    └── rbac
│        ├── auth_proxy_client_clusterrole.yaml
│        ├── auth_proxy_role.yaml
│        ├── auth_proxy_role_binding.yaml
│        ├── auth_proxy_service.yaml
│        ├── kustomization.yaml
│        ├── leader_election_role.yaml
│        ├── leader_election_role_binding.yaml
│        ├── role_binding.yaml
│        └── service_account.yaml
├── go.mod
├── go.sum
└── hack
    └── boilerplate.go.txt
```


`Kubebuilder`生成的`go.mod`和`Makefile`可能使用稍旧版本的`controller-runtime`和`controller-gen`。
如有必要，请更新以使用最新版本。

现在让我们看一下每个生成的文件

## Makefile

这是一个用于生成代码、构建控制器等的`Makefile`。

`make help`可以查看命令的使用帮助。

```console
❯ make help

Usage:
  make <target>

General
  help             Display this help.

Development
  manifests        Generate WebhookConfiguration, ClusterRole and CustomResourceDefinition objects.
  generate         Generate code containing DeepCopy, DeepCopyInto, and DeepCopyObject method implementations.
  fmt              Run go fmt against code.
  vet              Run go vet against code.
  test             Run tests.

Build
  build            Build manager binary.
  run              Run a controller from your host.
  docker-build     Build docker image with the manager.
  docker-push      Push docker image with the manager.
  docker-buildx    Build and push docker image for the manager for cross-platform support

Deployment
  install          Install CRDs into the K8s cluster specified in ~/.kube/config.
  uninstall        Uninstall CRDs from the K8s cluster specified in ~/.kube/config. Call with ignore-not-found=true to ignore resource not found errors during deletion.
  deploy           Deploy controller to the K8s cluster specified in ~/.kube/config.
  undeploy         Undeploy controller from the K8s cluster specified in ~/.kube/config. Call with ignore-not-found=true to ignore resource not found errors during deletion.

Build Dependencies
  kustomize        Download kustomize locally if necessary. If wrong version is installed, it will be removed before downloading.
  controller-gen   Download controller-gen locally if necessary. If wrong version is installed, it will be overwritten.
  envtest          Download envtest-setup locally if necessary.
```

## PROJECT

描述了域名、存储库 URL 以及有关生成的 API 的信息。
基本上，可能不会经常编辑此文件。

## hack/boilerplate.go.txt

这是插入在自动生成的源代码开头的样板。

默认情况下，已写入`Apache 2`许可证的文本，因此请根据需要重写它。

## cmd/main.go

这是源代码，它将成为我们将创建的自定义控制器的入口.

源码中写有`//+kubebuilder:scaffold:imports`、`//+kubebuilder:scaffold:scheme`、`//+kubebuilder:scaffold:builder`等注释。
`Kubebuilder`使用这些注释作为指导自动生成源代码，因此请注意不要删除它们。

## config

在`config`目录下生成用于将自定义控制器部署到`Kubernetes`集群的清单。

根据要实现的功能，某些清单可能不是必需的，因此请相应地选择。

### default

包含一次性使用清单的设置。

`manager_auth_proxy_patch.yaml` 是使用[kube-auth-proxy][] 所需的补丁。
如果不使用kube-auth-proxy，删除也没有问题

`manager_config_patch.yaml` 是一个补丁文件，用于使用 ConfigMap 而不是参数指定自定义控制器选项。

根据您使用的清单编辑`kustomization.yaml`

### manager

这是自定义控制器的部署资源的清单。
请根据需要重写，例如更改自定义控制器的命令行选项时。

### prometheus


Prometheus Operator的自定义资源清单。
如果您使用 Prometheus Operator，应用此清单将使 Prometheus 能够自动收集自定义控制器的指标。

### rbac

这是用于设置各种权限的清单。

以 auth_proxy_ 开头的四个文件是 [kube-auth-proxy][] 的清单。
使用 kube-auth-proxy，您可以通过 RBAC 限制对指标端点的访问。

`leader_election_role.yaml` 和 `leader_election_role_binding.yaml` 是使用领导者选举功能所需的权限。

`role.yaml` 和 `role_binding.yaml` 是为控制器设置访问各种资源的权限的清单.

这两个文件基本上是自动生成的，不需要开发者编辑。

如果删除不需要的文件，请同时编辑`kustomization.yaml`

[kube-auth-proxy]: https://github.com/brancz/kube-rbac-proxy
