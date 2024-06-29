# Webhookマニフェストの生成

为了使用Admission Webhook，您需要准备`MutatingWebhookConfiguration`和`ValidatingWebhookConfiguration等清单。
controller-gen 可以根据 `// +kubebuilder:webhook` 标记描述生成清单。

首先，让我们看一下设置默认值的 webhook 标记

[import:"webhook-defaulter"](../../codes/20_manifests/api/v1/markdownview_webhook.go)

还要检查验证 Webhook 标记。

[import:"webhook-validator"](../../codes/20_manifests/api/v1/markdownview_webhook.go)

- `path`：指定 webhook 的路径。该路径是由controller-runtime自动生成的，所以基本上不用更改就可以使用它。
- `mutating`：指定是否使用 webhook 重写值。为默认者指定“true”，为验证者指定“false”。
- `failurePolicy`：指定 Webhook API 调用失败时的行为。如果指定`fail`，则在无法调用 Webhook 的情况下无法创建资源。如果指定`ignore`，即使无法调用 Webhook，也会创建资源。
- `sideEffects`：指定 Webhook API 调用是否有副作用。这会影响在试运行模式下调用 API 服务器时的行为。如果没有副作用，则指定“None”；如果有副作用，则指定`Some`。
- `groups`、`versions`、`resource`：指定 Webhook 所针对的资源的 GVK。
- `verbs`：您可以指定 webhook 所针对的资源的操作。您可以指定“创建”、“更新”、“删除”等
- `name`：指定 webhook 的名称。必须是由点分隔的三个或更多段的域名
- `admissionReviewVersions`：指定 webhook 支持的 AdmissionReview 版本。如果只想在 Kubernetes 1.16 或更高版本的环境中运行，则仅使用 `v1` 是没有问题的。如果您想在 1.15 之前的环境中运行，还需指定 `v1beta1`。

运行`make manifests`将根据标记的内容生成如下所示的清单文件。

[import](../../codes/20_manifests/config/webhook/manifests.yaml)
