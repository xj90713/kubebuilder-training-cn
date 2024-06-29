# 检查自定义控制器的操作

通过Kubebuilder构建生成的项目，并在[Kind](https://kind.sigs.k8s.io/docs/user/quick-start/)环境中运行它。

Kind 是一种用于在本地环境构建 Kubernetes 集群的工具，可以轻松进行控制器的测试和操作确认。

## kind启动集群

首先，使用`kind`命令创建kubernetes集群。

```console
$ kind create cluster
```

## 安装cert-manager

为了给`Webhook`颁发证书，需要使用`cert-manager`。执行以下命令部署`cert-manager`（[参考](https://cert-manager.io/docs/installation/kubernetes/)）：

```console
$ kubectl apply --validate=false -f https://github.com/jetstack/cert-manager/releases/latest/download/cert-manager.yaml
```

通过如下命令来确认`cert-manager`的pod是否已经启动。

```console
$ kubectl get pod -n cert-manager
NAME                                       READY   STATUS    RESTARTS   AGE
cert-manager-7dd5854bb4-whlcn              1/1     Running   0          26s
cert-manager-cainjector-64c949654c-64wjk   1/1     Running   0          26s
cert-manager-webhook-6bdffc7c9d-hkr8h      1/1     Running   0          26s
```

## 准备控制器的容器镜像

构建容器镜像的命令。

```console
$ make docker-build
```

要使用此容器镜像，您需要将构建的容器镜像推送到`DockerHub`等容器注册表，或者将其加载到您的`kind`环境中。

以下是将容器镜像加载到`kind`环境中的命令：

```console
$ kind load docker-image controller:latest
```

此外，如果将`latest`指定为容器镜像的标签，那么`ImagePullPolicy`将默认为`Always`，这可能会导致加载的容器镜像未被使用，即使它已经存在。
([参考](https://kind.sigs.k8s.io/docs/user/quick-start/#loading-an-image-into-your-cluster))

因此，请在 `config/manager/manager.yaml` 文件中添加 `imagePullPolicy: IfNotPresent`。

[import:"containers"](../../codes/10_tilt/config/manager/manager.yaml)

## 验证控制器操作

将自定义资源定义(CRD)应用到kubernetes集群中。

```console
$ make install
```

接下来，将应用各种清单文件。

```console
$ make deploy
```

确认控制器的pod知否已经处于运行状态。

```console
$ kubectl get pod -n markdown-view-system
NAME                                                READY   STATUS    RESTARTS   AGE
markdown-view-controller-manager-5bc678bbf9-vb9r5   2/2     Running   0          30s
```

接下来，查看控制器的日志

```console
$ kubectl logs -n markdown-view-system markdown-view-controller-manager-5bc678bbf9-vb9r5 -c manager -f
```

现在，将应用示例的自定义资源。

```console
$ kubectl apply -f config/samples/view_v1_markdownview.yaml
```

如果在控制器中看到类似`Webhook`或`Reconcile`的消息，则表示操作成功。

```console
2021-07-10T09:29:49.311Z        INFO    controller-runtime.metrics      metrics server is starting to listen     {"addr": "127.0.0.1:8080"}
2021-07-10T09:29:49.311Z        INFO    controller-runtime.builder      Registering a mutating webhook   {"GVK": "view.zoetrope.github.io/v1, Kind=MarkdownView", "path": "/mutate-view-zoetrope-github-io-v1-markdownview"}
2021-07-10T09:29:49.311Z        INFO    controller-runtime.webhook      registering webhook      {"path": "/mutate-view-zoetrope-github-io-v1-markdownview"}
2021-07-10T09:29:49.311Z        INFO    controller-runtime.builder      Registering a validating webhook {"GVK": "view.zoetrope.github.io/v1, Kind=MarkdownView", "path": "/validate-view-zoetrope-github-io-v1-markdownview"}
2021-07-10T09:29:49.311Z        INFO    controller-runtime.webhook      registering webhook      {"path": "/validate-view-zoetrope-github-io-v1-markdownview"}
2021-07-10T09:29:49.311Z        INFO    setup   starting manager
I0710 09:29:49.312373       1 leaderelection.go:243] attempting to acquire leader lease markdown-view-system/c124e721.zoetrope.github.io...
2021-07-10T09:29:49.312Z        INFO    controller-runtime.manager      starting metrics server  {"path": "/metrics"}
2021-07-10T09:29:49.312Z        INFO    controller-runtime.webhook.webhooks     starting webhook server
2021-07-10T09:29:49.312Z        INFO    controller-runtime.certwatcher  Updated current TLS certificate
2021-07-10T09:29:49.312Z        INFO    controller-runtime.webhook      serving webhook server   {"host": "", "port": 9443}
2021-07-10T09:29:49.312Z        INFO    controller-runtime.certwatcher  Starting certificate watcher
I0710 09:29:49.409787       1 leaderelection.go:253] successfully acquired lease markdown-view-system/c124e721.zoetrope.github.io
2021-07-10T09:29:49.409Z        DEBUG   controller-runtime.manager.events       Normal  {"object": {"kind":"ConfigMap","namespace":"markdown-view-system","name":"c124e721.zoetrope.github.io","uid":"b48865ea-3d05-47bd-be4f-4d03a14b7a36","apiVersion":"v1","resourceVersion":"1982"}, "reason": "LeaderElection", "message": "markdown-view-controller-manager-5bc678bbf9-vb9r5_d64b0043-4a95-432e-9c76-3001247a87ac became leader"}
2021-07-10T09:29:49.409Z        DEBUG   controller-runtime.manager.events       Normal  {"object": {"kind":"Lease","namespace":"markdown-view-system","name":"c124e721.zoetrope.github.io","uid":"3ef3dcde-abbb-440b-9052-1c85ed01d67d","apiVersion":"coordination.k8s.io/v1","resourceVersion":"1983"}, "reason": "LeaderElection", "message": "markdown-view-controller-manager-5bc678bbf9-vb9r5_d64b0043-4a95-432e-9c76-3001247a87ac became leader"}
2021-07-10T09:29:49.410Z        INFO    controller-runtime.manager.controller.markdownview       Starting EventSource    {"reconciler group": "view.zoetrope.github.io", "reconciler kind": "MarkdownView", "source": "kind source: /, Kind="}
2021-07-10T09:29:49.410Z        INFO    controller-runtime.manager.controller.markdownview       Starting Controller     {"reconciler group": "view.zoetrope.github.io", "reconciler kind": "MarkdownView"}
2021-07-10T09:29:49.511Z        INFO    controller-runtime.manager.controller.markdownview       Starting workers        {"reconciler group": "view.zoetrope.github.io", "reconciler kind": "MarkdownView", "worker count": 1}
2021-07-10T09:33:53.622Z        DEBUG   controller-runtime.webhook.webhooks     received request {"webhook": "/mutate-view-zoetrope-github-io-v1-markdownview", "UID": "20fe30b5-6d45-4592-ae4b-ee5048e054d1", "kind": "view.zoetrope.github.io/v1, Kind=MarkdownView", "resource": {"group":"view.zoetrope.github.io","version":"v1","resource":"markdownviews"}}
2021-07-10T09:33:53.623Z        INFO    markdownview-resource   default {"name": "markdownview-sample"}
2021-07-10T09:33:53.623Z        DEBUG   controller-runtime.webhook.webhooks     wrote response   {"webhook": "/mutate-view-zoetrope-github-io-v1-markdownview", "code": 200, "reason": "", "UID": "20fe30b5-6d45-4592-ae4b-ee5048e054d1", "allowed": true}
2021-07-10T09:33:53.626Z        DEBUG   controller-runtime.webhook.webhooks     received request {"webhook": "/validate-view-zoetrope-github-io-v1-markdownview", "UID": "904fc35e-4415-4a90-af96-52cbe1cef1b7", "kind": "view.zoetrope.github.io/v1, Kind=MarkdownView", "resource": {"group":"view.zoetrope.github.io","version":"v1","resource":"markdownviews"}}
2021-07-10T09:33:53.626Z        INFO    markdownview-resource   validate create {"name": "markdownview-sample"}
2021-07-10T09:33:53.626Z        DEBUG   controller-runtime.webhook.webhooks     wrote response   {"webhook": "/validate-view-zoetrope-github-io-v1-markdownview", "code": 200, "reason": "", "UID": "904fc35e-4415-4a90-af96-52cbe1cef1b7", "allowed": true}
```

## 高效开发流程

在开发过程中，您需要重写自定义控制器实现并多次检查其操作。
您可以按照以下步骤高效地进行开发

- 如果控制器实现发生更改，请使用以下命令构建容器映像并将其重新加载到`kind`环境中。
```
$ make docker-build
$ kind load docker-image controller:latest
```

- 如果`CRD`有任何更改，请运行以下命令。但是，如果您进行不兼容的更改，此命令将会失败，因此请先运行`make uninstall`。
```
$ make install
```

- 如果除CRD之外的清单文件有更改，请执行以下命令。但是，如果您进行不兼容的更改，此命令将会失败，因此请提前运行`make undeploy`
- 
```
$ make deploy
```

- 可以通过如下命令进行重新启动自定义控制器
```
$ kubectl rollout restart -n markdown-view-system deployment markdown-view-controller-manager
```

## 利用Tilt进行高效开发

如上所述，在开发自定义控制器时，每次更改源代码或者清单时都需要多次执行多个make命令，非常麻烦

[Tilt](https://tilt.dev)允许监视源代码和清单的更改，它将自动重建容器镜像、将清单应用到Kubernetes集群、重新启动pod等。

如果有兴趣可以查看如下文章。

- [使用Tilt简化自定义控制器开发](https://zenn.dev/zoetro/articles/fba4c77a7fa3fb)

本书中的示例程序是为了可以使用Tilt而设置的。
详情请参阅下面的代码。

- https://github.com/zoetrope/kubebuilder-training/tree/main/codes/10_tilt

首先，参考以下页面安装[aqua](https://aquaproj.github.io)。

- https://aquaproj.github.io/docs/reference/install

接下来，使用aqua安装各种工具。

```console
$ aqua i
```

接下来，运行以下命令启动`Kubernetes`集群和容器注册表，并部署`cert-manager`。

```console
$ make start
```

最后，启动tilt并在浏览器中访问http://localhost:10350

```console
$ tilt up
```

如果一切正常，该类型的资源应该会自动更新，以响应源代码或清单中的更改。

完成后，执行以下命令。


```console
$ make stop
```
