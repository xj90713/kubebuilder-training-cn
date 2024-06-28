# controller-runtime

要开发自定义控制器，请使用 [client-go](https://github.com/kubernetes/client-go)、[apimachinery](https://github.com/kubernetes/apimachinery)、[api](https://github.com/kubernetes/api）。

[controller-runtime](https://github.com/kubernetes-sigs/controller-runtime) 是一个抽象和隐藏这些包的库，可以更轻松地实现自定义控制器。

虽然它是抽象和隐藏的，但它的实现方式却符合 Kubernetes 理念。
如果需要，您可以通过指定选项来使用`client-go`和`apimachinery`提供的大部分功能。

如果您想了解controller-runtime的设计理念，请参考【KubeBuilder设计原理】(https://github.com/kubernetes-sigs/kubebuilder/blob/master/DESIGN.md#controller-runtime)。

controller-runtime控制运行时提供的主要组件包括：
- [manager.Manager](https://pkg.go.dev/sigs.k8s.io/controller-runtime/pkg/manager?tab=doc#Manager)
  - 用于同时管理多个控制器的组件。
  - 提供实现自定义控制器所需的许多功能，例如领导者选举和指标服务器功能。
- [client.Client](https://pkg.go.dev/sigs.k8s.io/controller-runtime/pkg/client?tab=doc#Client)
  - 用于与 Kubernetes 中的 kube-apiserver 交互的客户端。
  - 它具有在内存中缓存受监控资源的功能，并且是一个可以安全处理自定义资源类型的客户端。
- [reconcile.Reconciler](https://pkg.go.dev/sigs.k8s.io/controller-runtime/pkg/reconcile?tab=doc#Reconciler)
  - 自定义控制器应实现的接口。

以下几页将详细解释这些功能。
