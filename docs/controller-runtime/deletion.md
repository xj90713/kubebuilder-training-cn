# 资源清理

在这里，我们将解释关于在Kubernetes中执行资源清理的过程。

实际上，在控制器中执行清理操作是一个具有挑战性的问题。
例如，如果要删除MarkdownView资源，还必须同时删除与该MarkdownView关联的ConfigMap、Deployment和Service资源。
但是，如果错过了删除MarkdownView的事件，那么与该资源相关的信息将消失，您将无法判断应删除哪些关联资源。


## 基于ownerReference的垃圾收集

第一个资源清理机制是基于ownerReference的垃圾收集。([参考](https://kubernetes.io/docs/concepts/workloads/controllers/garbage-collection/))。
这意味着当父资源被删除时，通过垃圾收集机制会自动删除与该资源关联的子资源。

Kubernetes使用`.metadata.ownerReferences`字段来表示资源之间的父子关系。

通过使用controller-runtime提供的[controllerutil.SetControllerReference](https://pkg.go.dev/sigs.k8s.io/controller-runtime/pkg/controller/controllerutil?tab=doc#SetControllerReference)函数，您可以为指定资源设置ownerReference。

让我们尝试在先前创建的`reconcileConfigMap`函数中使用`controllerutil.SetControllerReference`。

[import:"reconcile-configmap",unindent:"true"](../../codes/50_completed/internal/controller/markdownview_controller.go)

使用此函数，ConfigMap资源将被赋予以下形式的`.metadata.ownerReferences`，其中这个资源将包含父资源的信息。

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  creationTimestamp: "2021-07-25T09:35:43Z"
  name: markdowns-markdownview-sample
  namespace: default
  ownerReferences:
  - apiVersion: view.zoetrope.github.io/v1
    blockOwnerDeletion: true
    controller: true
    kind: MarkdownView
    name: markdownview-sample
    uid: 8e8701a6-fa67-4ab8-8e0c-29c21ae6e1ec
  resourceVersion: "17582"
  uid: 8803226f-7d8f-4632-b3eb-e47dc36eabf3
data:
  ・・省略・・
```


在这种情况下，如果删除父MarkdownView资源，子ConfigMap资源也将被自动删除。

另外，无法将位于不同命名空间的资源作为owner，也无法将命名空间范围的资源指定为cluster-scoped资源的owner。

此外，除了`SetControllerReference`之外，还有一个类似的函数叫做[controllerutil.SetOwnerReference](https://pkg.go.dev/sigs.k8s.io/controller-runtime/pkg/controller/controllerutil?tab=doc#SetOwnerReference)。
`SetControllerReference`只能为一个资源指定一个owner，而且由于`controller`字段和`blockOwnerDeletion`字段都设置为true，直到子资源被删除前，父资源的删除都会被阻止。
另一方面，`SetOwnerReference`允许为一个资源指定多个owner，并且不会阻止子资源的删除。

`controllerutil.SetControllerReference`不支持用于Server-Side Apply的ApplyConfiguration类型。
因此，我们可以准备一个辅助函数来处理这种情况。
[import:"controller-reference",unindent:"true"](../../codes/50_completed/internal/controller/markdownview_controller.go)

```go
func SetOwnerReference(obj, owner metav1.Object, scheme *runtime.Scheme) error {
	ownerRef := metav1.NewControllerRef(owner, owner.GetObjectKind().GroupVersionKind())
	return controllerutil.SetControllerReference(ownerRef, obj, scheme)
}
```

当使用Server-Side Apply的垃圾收集时，可以使用这个辅助函数在创建ApplyConfiguration类型时设置ownerReference。

[import:"service-apply-configuration",unindent:"true"](../../codes/50_completed/internal/controller/markdownview_controller.go)

```go
applyConfig := &unstructured.Unstructured{
	Object: map[string]interface{}{
		"apiVersion": "v1",
		"kind":       "Service",
		"metadata": map[string]interface{}{
			"name":      "my-service",
			"namespace": "default",
		},
	},
}

if err := SetOwnerReference(applyConfig, mdView, r.Scheme); err != nil {
	return ctrl.Result{}, err
}
```

## Finalizer

### Finalizer机制

通过ownerReference和垃圾收集，我们可以删除父资源时自动删除子资源。
然而，仅凭这种机制是无法处理所有情况的。
例如，如果要删除与父资源不同命名空间或作用域的子资源，或者要删除Kubernetes以外管理的外部资源时，垃圾收集功能将无法使用。

对于这种情况，可以使用Finalizer机制。

要使用Finalizer机制，首先需要在父资源的`finalizers`字段中指定Finalizer的名称。
请确保这个名称能够被MarkdownView控制器识别为其管理的Finalizer，并且不会与其他控制器产生冲突。

```yaml
apiVersion: view.zoetrope.github.io/v1
kind: MarkdownView
metadata:
  finalizers:
  - markdownview.view.zoetrope.github.io/finalizer
# 以下省略
```

即使您尝试删除具有“finalizers”字段的资源，也不会删除该资源。
相反，只需添加“deletionTimestamp”，如下所示。



```yaml
apiVersion: view.zoetrope.github.io/v1
kind: MarkdownView
metadata:
  finalizers:
    - markdownview.view.zoetrope.github.io/finalizer
  deletionTimestamp: "2021-07-24T15:23:54Z"
# 以下省略
```

当自定义控制器发现已给出`deletionTimestamp`时，它将删除与该资源关联的资源，然后删除`finalizers`字段。
当`finalizers`字段为空时，Kubernetes将永久删除该资源。

通过这种机制，即使控制器错过了删除事件，Reconcile 也会被多次调用，直到目标资源被删除，避免了子资源信息丢失和无法删除的问题。
另一方面，请注意，如果在删除自定义资源之前删除控制器，则会遇到自定义资源永远不会被删除的问题。

### Finalizer如何实现

现在让我们实现 Finalizer。
在controller-runtime中，处理Finalizer的实用函数是 [controllerutil.ContainsFinalizer](https://pkg.go.dev/sigs.k8s.io/controller-runtime/pkg/controller/controllerutil?tab=doc#ContainsFinalizer), [controllerutil.AddFinalizer](https://pkg.go.dev/sigs.k8s.io/controller-runtime/pkg/controller/controllerutil?tab=doc#AddFinalizer), [controllerutil.RemoveFinalizer](https://pkg.go.dev/sigs.k8s.io/controller-runtime/pkg/controller/controllerutil?tab=doc#RemoveFinalizer)，所以使用这个。

您可以使用`Finalizers`字段实现您自己的资源删除过程，如下所示。

```go
finalizerName := "markdwonview.view.zoetrope.github.io/finalizer"
if !mdView.ObjectMeta.DeletionTimestamp.IsZero() {
    // 如果deletionTimestamp不为零，则表示资源删除已经开始。

    // 如果finalizer中存在上面指定的名称，请将其删除。
    if controllerutil.ContainsFinalizer(&mdView, finalizerName) {
        // 在此处删除外部资源
        deleteExternalResources()

        // 删除finalizers字段，以便可以删除资源
        controllerutil.RemoveFinalizer(&mdView, finalizerName)
        err = r.Update(ctx, &mdView)
        if err != nil {
            return ctrl.Result{}, err
        }
    }
    return ctrl.Result{}, nil
}

// 如果未提供deletionTimestamp，则添加finalizer字段。
if !controllerutil.ContainsFinalizer(&mdView, finalizerName) {
    controllerutil.AddFinalizer(&mdView, finalizerName)
    err = r.Update(ctx, &mdView)
    if err != nil {
        return ctrl.Result{}, err
    }
}
```
