# 快速操作

## 通过`make run`运行

在开发控制器时，经常需要多次重建和重新运行程序，由于构建容器镜像需要时间，这可能效率不高。此外，作为容器运行的程序调试起来也比较困难。

Kubebuilder生成的Makefile包含一个名为`make run`的目标，允许您将控制器作为本地进程运行。这样可以避免反复构建容器镜像带来的低效问题。

然而，与在Kubernetes集群上运行相比，存在如下差异，请注意谨慎使用。

* 如果使用领导选举功能，则需要在[Options](https://pkg.go.dev/sigs.k8s.io/controller-runtime/pkg/manager?tab=doc#Options)指定`LeaderElectionNamespace`。
* 存在证书、`API`访问路径等问题，`Webhook`无法正常工作。
* 控制器访问`API`服务器时的权限与在集群内运行时不同（例如，使用`$HOME/.kube/config`中的设置将具有与`kubectl` 相同的权限）。
* 无法使用[Downward API](https://kubernetes.io/docs/tasks/inject-data-application/downward-api-volume-expose-pod-information/)。

<!--
TODO: 使用Telepresence运行自定义控制器时，可能会出现与缓存相关的问题？

## 使用`Telepresence`运行

使用`make run`运行时存在几个问题，如上所述。
特别是，无法轻松操作 Webhook 是不便的。

因此，我将介绍如何使用名为`Telepresence`的工具，将控制器作为本地进程运行的方法。

首先，请参考以下页面安装`Telepresence v2`。

* [Install Telepresence](https://www.telepresence.io/docs/latest/install/)

在使用`Telepresence`运行自定义控制器时，请注意以下几点。

在Telepresence中，目标工作负载会注入一个名为`traffic-agent`的容器，这个容器需要以root权限运行。

在由Kubebuilder生成的[manager.yaml](../../codes/markdown-view/config/manager/manager.yaml)文件中，`SecurityContext`中指定了`runAsNonRoot: true`，因此您需要将其注释掉。

```yaml
      securityContext:
        runAsNonRoot: true
```

此外，使用`Telepresence`时，挂载到容器中的`ConfigMap`和 `Secret`会被挂载到本地目录中。
因此，访问`ConfigMap`和`Secret`时的路径在使用`Pod`方式运行和使用`Telepresence`运行时会有所不同。

您可以使用环境变量`TELEPRESENCE_ROOT`获取本地挂载目录的路径。
在由`Kubebuilder`生成的自定义控制器中，您可以设置`Webhook`证书的路径如下，并将其作为`NewManager`的选项进行指定。

[import:"telepresence,new-manager",unindent="true"](../../codes/markdown-view/main.go)

```go
	//! [telepresence]
	certDir := filepath.Join("tmp", "k8s-webhook-server", "serving-certs")
	root := os.Getenv("TELEPRESENCE_ROOT")
	fmt.Printf("TELEPRESENCE_ROOT: %s\n", root)
	time.Sleep(30 * time.Second)
	if len(root) != 0 {
		certDir = filepath.Join(root, certDir)
	} else {
		certDir = filepath.Join("/", certDir)
	}
	//! [telepresence]

	mgr, err := ctrl.NewManager(ctrl.GetConfigOrDie(), ctrl.Options{
		Scheme:                 scheme,
		MetricsBindAddress:     metricsAddr,
		Port:                   9443,
		HealthProbeBindAddress: probeAddr,
		LeaderElection:         enableLeaderElection,
		LeaderElectionID:       "c124e721.zoetrope.github.io",
		CertDir:                certDir,
	})
```

此外，Telepresence 使用 sshfs 将卷挂载到本地。
如果卷挂载功能无法正常工作，请检查 sshfs 是否已安装，并验证 `/etc/fuse.conf` 中是否指定了以下选项。

```text
user_allow_other
```

准备就绪后，请按照[Kind部署](./kind.md)中的步骤进行部署控制器。

最後に下記のコマンドで、Kubernetes上で動いているコントローラを、make runを実行して起動したプロセスと置き換えます。

```console
最后，使用以下命令将在 Kubernetes 上运行的控制器替换为通过 `make run` 启动的进程。
```

-->
