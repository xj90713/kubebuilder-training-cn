# 应用技巧

## 更新

注意，Annotations等某些字段可能会被Kubernetes的标准控制器设置值。因此，如果像下面这样覆盖数值，其他控制器设置的数值可能会消失。

```go
op, err := ctrl.CreateOrUpdate(ctx, r.Client, role, func() error {
	role.Annotations = map[string]string{
		"an1": "test",
	}
	return nil
}
```

为避免这种问题，更新Annotations时应该进行添加而不是覆盖，如下所示。

```go
op, err := ctrl.CreateOrUpdate(ctx, r.Client, role, func() error {
	if role.Annotations == nil {
		role.Annotations = make(map[string]string)
	}
	role.Annotations["an1"] = "test"
	return nil
}
```

### 事件过滤

在`WithEventFilter`中、可以通过`For`, `Owns`, `Watches`来过滤监视对象的资源变更事件，如后文所示，对于每个`For`或`Owns`，也可以更细致的进行过滤。

通过准备类似一下的[predicate.Funcs](https://pkg.go.dev/sigs.k8s.io/controller-runtime/pkg/predicate?tab=doc#Funcs)然后通过`WithEventFilter`函数进行指定。

[import:"pred",unindent:"true"](../../codes/tenant/controllers/tenant_controller.go)

例如，可以通过使`CreateFunc`返回`true`，`DeleteFunc`和`UpdateFunc`返回`false`的方式，使`Reconcile`在资源创建时调用。 此外，可以利用传入的事件详细信息实现更复杂的过滤。 

注意，向`kube-apiserver`发出的`CREATE/UPDATE/PATCH`操作不一定会一一对应为事件。
例如在`CREATE`后立即进行`UPDATE`，则可能只调用`CreateFunc`。另外，即使资源实际上没有更新，在控制器刚启动时也会触发`CREATE`事件。由于这种行为，不建议对事件进行过滤以便在`CREATE`和`UPDATE`中执行不同的更新操作。

另外，虽然使用`WithEventFilter`会对所有`For`、`Owns`和`Watches`指定的监视对象应用过滤器，但也可以单独为每个`For`、`Owns`和`Watches`选项指定过滤器。



```go
return ctrl.NewControllerManagedBy(mgr).
	For(&multitenancyv1.Tenant{}, builder.WithPredicates(pred1)).
	Owns(&corev1.Namespace{}, builder.WithPredicates(pred2)).
	Owns(&rbacv1.RoleBinding{}, builder.WithPredicates(pred3)).
	Watches(&src, &handler.EnqueueRequestForObject{}, builder.WithPredicates(pred4)).
	Complete(r)
```

### 监视外部事件

`Watches`用于监视除上述事件之外的外部事件。

除了监控Kubernetes资源的更改外，您可能还希望根据外部事件触发协调。例如，您可能希望基于GitHub webhook调用执行处理，或轮询外部状态并根据这些状态的变化触发处理。

作为监控外部事件的示例，我们将实现一个机制，每10秒启动一次，并在租户资源处于就绪状态时发出事件。

[import](../../codes/tenant/controllers/external_event.go)

使用`mgr.Add`将上述的`watcher`注册到`manager`中，并监听`GenericEvent`

[import:"external-event,managedby",unindent:"true"](../../codes/tenant/controllers/tenant_controller.go)

通过这样设置，当存在Ready状态的租户资源时，每10秒将触发调用 Reconcile。

### 状态更新

比如，我们可以使用`status.phase`字段来维护状态，并根据状态进行相应的操作。让我们考虑一下这样的控制器

当第一次执行控制器的`Reconcile`时，状态为`A`

```yaml
status:
  phase: A
```

当下一次执行控制器的`Reconcile`,状态已经变为`C`

```yaml
status:
  phase: C
```

因此，避免上述这种状态的方式，并将每个状态的`ON/OFF`以列表的形式表示，可以确保在状态变为B时不会错过事件，从而能够正确执行所需的处理。

```yaml
status:
  conditions:
  - type: A
    status: True
  - type: B
    status: True
  - type: C
    status: False
```

[API Conventions](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api-conventions.md)

如果控制器处理的资源没有进行任何更改，则无需更新状态。
因此，我将用标志将其返回，以查看是否已执行更新如下。


[import:"reconcile"](../../codes/tenant/controllers/tenant_controller.go)

根据上述函数的返回值更新状态。
为了更新条件，准备了函数`meta.setStatuscondition（）`。
使用此功能，如果已经存在相同类型的条件，则将更新该值，如果不存在，则将添加该值。
另外，仅当条件的值更改时，才会更新'LastTransitionTime'。

[import:"status",unindent:"true"](../../codes/tenant/controllers/tenant_controller.go)

由此，用户可以检查租户资源的状态。


## 基于client-go自定义开发

如果使用`client-go`处理自定义资源`CRD`，可以选择使用动态类型客户端、[k8s.io/client-go/dynamic](https://pkg.go.dev/k8s.io/client-go/dynamic?tab=doc)或者[k8s.io/apimachinery/pkg/apis/meta/v1/unstructured](https://pkg.go.dev/k8s.io/apimachinery/pkg/apis/meta/v1/unstructured?tab=doc)，或者使用[kubernetes/code-generator](https://github.com/kubernetes/code-generator)进行代码生成。

在controller-runtime的Client中，只需将结构体作为参数传递，它就可以区分标准资源和自定义资源并调用相应的 API。这个Client是如何实现这一机制的呢？

首先，它从已注册到Scheme中的信息中查找传递的结构体类型。通过这样做，可以获取到 GVK（Group, Version, Kind）。

接下来，为了调用`REST API`，需要解析`REST API`的路径。
对于命名空间范围内的资源，REST API的路径形式为`/apis/{group}/{version}/namespaces/{namespace}/{resource}/{name}`；对于集群范围的资源，路径形式为`/apis/{group}/{version}/{resource}/{name}`。
这些信息通常记录在自定义资源定义`（CRD）`中，因此需要向`API`服务器查询这些信息。

这些信息也可以通过`kubectl`来确认。让我们尝试执行以下命令。

```
$ kubectl api-resources --api-group="multitenancy.example.com"
NAME      SHORTNAMES   APIGROUP                   NAMESPACED   KIND
tenants                multitenancy.example.com   false        Tenant
```

API 服务器查询获得了 REST API 的路径。最后，我们将沿此路径发出请求。

客户端通过这种机制，能够使用同样的方法处理标准资源和自定义资源，实现了一个类型安全且易于使用的客户端。

## unstructured缓存

## Logger记录

在`Reconcile`内使用日志记录

通过参考文章。

关于选项更改
