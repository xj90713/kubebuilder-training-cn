# Webhook测试

## 设置测试环境

与控制器测试类似，Webhook也可以使用Envtest进行测试。
Kubebuilder生成了用于执行测试的代码如下所示：

[import, title="api/v1/webhook_suite_test.go"](../../codes/40_reconcile/api/v1/webhook_suite_test.go)

基本上，这与控制器测试代码类似，但在创建`envtest.Environment`时，您需要指定Webhook的清单文件路径，
并且在调用`ctrl.NewManager`时，需要使用测试环境的参数来覆盖`Host`、`Port`和`CertDir`参数。

## Webhook测试

让我们来编写Webhook的测试代码。
[import, title="api/v1/markdownview_webhook_test.go"](../../codes/40_reconcile/api/v1/markdownview_webhook_test.go)

在MutatingWebhook的测试中，我们使用输入的清单文件（before.yaml）来创建资源，
并确保创建的资源与预期值的清单文件（after.yaml）内容一致。

在ValidatingWebhook的测试中，我们使用Valid的清单文件（valid.yaml）来创建资源，
并使用Invalid的清单文件（empty-markdowns.yaml、invalid-replicas.yaml、without-summary.yaml）来测试创建资源失败的情况。

最后，确保通过`make test`来运行测试。
