
# 控制器测试

controller-runtime提供了一个名为[envtest](https://pkg.go.dev/sigs.k8s.io/controller-runtime/pkg/envtest?tab=doc)的软件包，您可以使用它来执行控制器和Webhook的简单测试。

envtest会启动etcd和kube-apiserver来构建测试环境。此外，通过指定环境变量`USE_EXISTING_CLUSTER`，您也可以使用现有的Kubernetes集群进行测试。

在Envtest中，只启动etcd和kube-apiserver，而controller-manager和scheduler不会运行。因此，请注意，创建Deployment或CronJob资源时，并不会创建Pod。

controller-runtime提供了一个名为[Envtest Binaries Manager](https://github.com/kubernetes-sigs/controller-runtime/tree/master/tools/setup-envtest)的工具，通过使用这个工具，您可以设置Envtest使用的任意版本etcd和kube-apiserver的二进制文件。

值得注意的是，由controller-gen生成的测试代码使用了名为[Ginkgo](https://github.com/onsi/ginkgo)的测试框架。有关该框架的使用方法，请参阅[Ginkgo文档](https://onsi.github.io/ginkgo/)。

## 设置测试环境

让我们看一下由controller-gen自动生成的`internal/controller/suite_test.go`文件。

[import, title="internal/controller/suite_test.go"](../../codes/40_reconcile/internal/controller/suite_test.go)

首先，在`envtest.Environment`中进行测试环境的配置。在这里，通过`CRDDirectoryPaths`指定要应用的CRD清单文件的路径。

调用`testEnv.Start()`将启动etcd和kube-apiserver。然后只需像控制器的主函数一样执行初始化过程即可。

在测试完成时，调用`testEnv.Stop()`将关闭etcd和kube-apiserver。

## 控制器测试

接下来，让我们开始编写实际的测试。

[import](../../codes/40_reconcile/internal/controller/markdownview_controller_test.go)

首先，实现在每个测试执行之前和之后调用的`BeforeEach`和`AfterEach`函数。

在`BeforeEach`中，删除所有测试使用的资源（请注意，Service资源不支持`DeleteAllOf`，因此我们逐个删除）。然后创建MarkdownViewReconciler并启动Reconciliation Loop处理。

在`AfterEach`中，停止上面启动的Reconciliation Loop处理。

接下来，使用`It`来编写测试用例。

这些测试用例使用`k8sClient`将MarkdownView资源创建到Kubernetes集群中，并确保所期望的资源已经创建。由于Reconcile处理是异步运行的，因此使用Eventually函数等待资源创建完成。

值得注意的是，`newMarkdownView`是一个辅助函数，用于创建测试用的MarkdownView资源。

最后一个测试确保状态已更新。通常在这里应该测试状态是否为Healthy。然而，在Envtest中，由于缺少controller-manager，Deployment无法准备就绪，MarkdownView的状态也不会成为Healthy。因此，在这里只要状态有所更新就可以。请时刻意识到Envtest与实际Kubernetes集群的区别，编写测试时需要考虑这一点。

写好测试后，使用`make test`来运行测试。如果测试成功，将显示`ok`。

```console
?       github.com/zoetrope/markdown-view       [no test files]
ok      github.com/zoetrope/markdown-view/api/v1        6.957s  coverage: 51.6% of statements
ok      github.com/zoetrope/markdown-view/controllers   8.319s  coverage: 85.3% of statements
```