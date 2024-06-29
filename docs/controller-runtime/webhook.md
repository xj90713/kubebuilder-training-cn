
# Webhook实现

在Kubernetes中，在创建、更新、删除资源之前，您可以使用Webhook执行任意处理操作。
MutatingWebhook允许您更改资源的值，而ValidatingWebhook允许您验证值。

在controller-runtime中，为实现MutatingWebhook的Defaulter和ValidatingWebhook的Validator提供了支持。

## 实现Defaulter

首先是Defaulter的实现。
在Default方法中，您可以更改MarkdownView资源的值。

[import:"head,webhook-defaulter,default"](../../codes/40_reconcile/api/v1/markdownview_webhook.go)

在这里，如果`r.Spec.ViewerImage`为空，我们指定了默认的容器镜像。

## 实现Validator

接下来是Validator的实现。
ValidateCreate、ValidateUpdate、ValidateDelete分别在资源创建、更新和删除时调用。
通过在这些函数中检查MarkdownView资源的内容并返回错误，您可以导致操作失败。

[import:"head,webhook-validator,validate"](../../codes/40_reconcile/api/v1/markdownview_webhook.go)

这次，我们决定在ValidateCreate和ValidateUpdate中执行相同的验证。
如果`.Spec.Replicas`的值不在1到5的范围内，或者`.Spec.Markdowns`不包含`SUMMARY.md`，则视为错误。

在实现ValidationWebhook时，`"k8s.io/apimachinery/pkg/util/validation/field"`包非常有用。
使用该包，您可以指定错误的原因或有问题的字段，以便在验证错误时获得更明确的消息。

## 测试验证

现在，让我们验证Webhook的工作。

将实现了Webhook的自定义控制器部署到Kubernetes集群中，并应用以下未指定`ViewerImage`的清单文件。

```yaml
apiVersion: view.zoetrope.github.io/v1
kind: MarkdownView
metadata:
  name: markdownview-sample
spec:
  markdowns:
    SUMMARY.md: |
      # Summary

      - [Page1](page1.md)
    page1.md: |
      # Page 1

      它是第一页的内容。
  replicas: 1
```

检查创建的资源，如果`ViewerImage`中包含默认的容器镜像名称，则说明成功。

```
$ kubectl get markdownview markdownview-sample -o jsonpath="{.spec.viewerImage}"
peaceiris/mdbook:latest
```

接下来，让我们验证ValidationWebhook的工作。

尝试编辑之前创建的资源，将`replicas`设置为一个较大的值，或者在`markdowns`中不包含`SUMMARY.md`。
如果出现类似以下错误，则表示成功。

希望这可以帮到您！如果需要进一步帮助，请告诉我。

```
$ kubectl edit markdownview markdownview-sample

markdownviews.view.zoetrope.github.io "markdownview-sample" was not valid:
 * spec.replicas: Invalid value: 10: replicas must be in the range of 1 to 5.
 * spec.markdowns: Required value: markdowns must have SUMMARY.md.
```