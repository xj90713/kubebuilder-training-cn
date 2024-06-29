# Server Side Apply

Update和CreateOrUpdate操作中存在一个问题，即在获取资源然后更新之间，可能会有其他人修改资源，导致信息丢失的风险。

通过使用服务端应用(Server-Side Apply)方式，可以为资源的每个字段记录管理者信息，以便在多个控制器或用户对同一资源进行编辑时检测到冲突。
与MergePatch方式不同，SSA可以追踪每个字段的修改者。
通过`--show-managed-fields`，可以查看管理的字段。
当多个控制器尝试将同一字段更改为不同值时，将会触发冲突错误。

在SSA中，更改对象的字段时每个字段管理者都会被记录。

> Changes to objects are tracked through a "field management" mechanism: when a field value changes, ownership of the field transitions from the current manager to the manager making the change. An attempt to apply an object with a field that has a different value owned by a different manager will cause a conflict. This is done to signal the potential for operations to supersede changes made by other contributors. Conflicts can be caused deterministically, in which case the value is overwritten and ownership transitions.

以下介绍了如何使用Server-Side Apply方式中的`Patch()`方法。
下面的示例仅更新Deployment资源的`spec.replicas`字段。

在SSA中，Apply和Update是不同的操作。使用SSA应用时，操作会被视为Apply操作。其他情况下，如Create或Update，操作都将被视为Update。
如果不一致，即使FieldManager相同，也会被认为是从不同程序进行了更新。
因此，如果要使用SSA更新资源，请始终使用Patch而不是Create或Update。


应该从YAML中读取它还是一一指定它？

[import:"patch-apply"](codes/client-sample/main.go)

要使用Server-Side Apply，需要将`client.Apply`指定为第三个参数，并在选项中指定`FieldManager`。
由于`FieldManager`将标识各字段的管理者名称，因此请务必选择唯一的名称以避免与其他控制器冲突。
https://kubernetes.io/docs/reference/using-api/server-side-apply/#merge-strategy

可以通过Go结构体上的标记来控制如何合并列表或映射。有关详细信息，请参阅[Merge strategy](https://kubernetes.io/docs/reference/using-api/api-concepts/#merge-strategy)文档。

在SSA方式下,如果不同的控制器向同一资源添加完全相同的内容会如何处理呢？很可能可以添加，因此需要指定键进行区分。Markdown资源可能会受到相同情况影响。让我们尝试实际操作。

例如，您可以查看[ServiceSpec](https://pkg.go.dev/k8s.io/api/core/v1#ServiceSpec)。

```yaml
ports:
- containerPort: 1053
  name: dns
  protocol: UDP
- containerPort: 1053
  name: dns-tcp
  protocol: TCP
```

```go
	// The list of ports that are exposed by this service.
	// More info: https://kubernetes.io/docs/concepts/services-networking/service/#virtual-ips-and-service-proxies
	// +patchMergeKey=port
	// +patchStrategy=merge
	// +listType=map
	// +listMapKey=port
	// +listMapKey=protocol
	Ports []ServicePort `json:"ports,omitempty" patchStrategy:"merge" patchMergeKey:"port" protobuf:"bytes,1,rep,name=ports"`
```

由于appsv1.Deployment不可用，因为必须明确指定要更新的字段，这导致 Go 无法进行类型检查的问题。
从Kubernetes 1.21版本开始引入了ApplyConfiguration机制，所有字段都被定义为指针类型。将字段设置为`nil`可以明确表示不允许进行更改。

在使用CreateOrUpdate创建Deployment后，尝试从api-server获取该Deployment，并检查差异。

```diff
 spec:
+  progressDeadlineSeconds: 600
   replicas: 1
+  revisionHistoryLimit: 10
   selector:
     matchLabels:
       app.kubernetes.io/created-by: markdown-view-controller
       app.kubernetes.io/instance: markdownview-sample
       app.kubernetes.io/name: mdbook
+  strategy:
+    rollingUpdate:
+      maxSurge: 25%
+      maxUnavailable: 25%
+    type: RollingUpdate
   template:
     metadata:
+      creationTimestamp: null
       labels:
         app.kubernetes.io/created-by: markdown-view-controller
         app.kubernetes.io/instance: markdownview-sample
         app.kubernetes.io/name: mdbook
     spec:
       containers:
       - args:
         - serve
         - --hostname
         - 0.0.0.0
         command:
         - mdbook
         image: peaceiris/mdbook:latest
         imagePullPolicy: IfNotPresent
         livenessProbe:
+          failureThreshold: 3
           httpGet:
             path: /
             port: http
             scheme: HTTP
+          periodSeconds: 10
+          successThreshold: 1
+          timeoutSeconds: 1
         name: mdbook
         ports:
         - containerPort: 3000
           name: http
           protocol: TCP
         readinessProbe:
+          failureThreshold: 3
           httpGet:
             path: /
             port: http
             scheme: HTTP
+          periodSeconds: 10
+          successThreshold: 1
+          timeoutSeconds: 1
+        resources: {}
+        terminationMessagePath: /dev/termination-log
+        terminationMessagePolicy: File
         volumeMounts:
         - mountPath: /book/src
           name: markdowns
+      dnsPolicy: ClusterFirst
+      restartPolicy: Always
+      schedulerName: default-scheduler
+      securityContext: {}
+      terminationGracePeriodSeconds: 30
       volumes:
       - configMap:
+          defaultMode: 420
           name: markdowns-markdownview-sample
         name: markdowns
```

api-server可能会填充默认值，此外，通过某些Mutating Webhook可能会设置值，或者其他自定义控制器可能会修改值（例如，ArgoCD为受控资源添加标签）。

考虑到这些情况，正确设置要修改的字段是复杂的。

因此，在Server-Side Apply方式中，始终只设置您想要更改的字段是至关重要的。
