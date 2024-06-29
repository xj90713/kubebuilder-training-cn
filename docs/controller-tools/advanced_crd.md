# 产生CRD清单（应用）

它具有租户资源中未使用的高级功能

## Defaulting, Pruning

是指在创建或更新资源时，如果某些字段没有提供值，系统会自动填充这些字段的默认值。
要利用 Defaulting 功能，CRD（自定义资源定义）必须启用 Structural Scheme（结构化方案）并且 Pruning（修剪）功能也要开启。

要利用默认设置功能，必须要启动结构化方案和裁剪功能

要启用`Pruning`功能可以将CRD的`spec.preserveUnknownFields: false`，或者将其升级到v1。
默认值字段不能带有optional（可选）属性。


`apiextensions.k8s.io/v1beta1`

defaulting和pruning

`apiextensions.k8s.io/v1`

structural

```console
$ make manifests CRD_OPTIONS=crd:crdVersions=v1
```

## Server Side Apply标记

https://kubernetes.io/docs/reference/using-api/api-concepts/#merge-strategy

在Kubernetes中，可以只更新资源的一部分字段，而不是整个资源。

```yaml
apiVersion: multitenancy.example.com/v1
kind: Tenant
metadata:
  name: sample
spec:
  namespaces:
  - test1
  - test2
  syncResources:
  - apiVersion: v1
    kind: ConfigMap
    name: test
    namespace: sample1
    mode: remove
  - apiVersion: v1
    kind: ConfigMap
    name: test
    namespace: sample2
    mode: remove
```

```yaml
apiVersion: multitenancy.example.com/v1
kind: Tenant
metadata:
  name: sample
spec:
  syncResources:
  - apiVersion: v1
    kind: ConfigMap
    name: test
    namespace: sample2
    mode: ignore
```

```go
type TenantSpec struct {
	// +listType=map
	// +listMapKey=apiVersion
	// +listMapKey=kind
	// +listMapKey=name
	// +listMapKey=namespace
	SyncResources []SyncResource `json:"syncResources,omitempty"`
}
```

此外，将`listMapKey`指定的字段设置为`Required`或配置默认值。

## 利用现有资源

在前一节的例子中，`TenantSpec`的`Admin`字段使用了Kubernetes标准提供的[rbac/v1/Subject](https://pkg.go.dev/k8s.io/api/rbac/v1?tab=doc#Subject)类型。这样，可以将标准提供的资源嵌入到自定义资源中。

然而，在将标准资源嵌入到自定义资源时，可能会出现一些问题。

例如，看看嵌入 [core/v1/Container](https://pkg.go.dev/k8s.io/api/core/v1?tab=doc#Container) 类型的情况。

Container 包含以下的 Ports 字段。

```go
	// +optional
	// +patchMergeKey=containerPort
	// +patchStrategy=merge
	// +listType=map
	// +listMapKey=containerPort
	// +listMapKey=protocol
	Ports []ContainerPort `json:"ports,omitempty" patchStrategy:"merge" patchMergeKey:"containerPort" protobuf:"bytes,6,rep,name=ports"`
```

由于 Ports 字段带有 `+listMapKey=protocol` 标记，因此在运行 controller-gen 后将生成如下的 CRD。

```yaml
ports:
  description: List of ports to expose from the container.
    Exposing a port here gives the system additional information
    about the network connections a container uses, but
    is primarily informational. Not specifying a port
    here DOES NOT prevent that port from being exposed.
    Any port which is listening on the default "0.0.0.0"
    address inside a container will be accessible from
    the network. Cannot be updated.
  items:
    description: ContainerPort represents a network port
      in a single container.
    properties:
      containerPort:
        description: Number of port to expose on the pod's
          IP address. This must be a valid port number,
          0 < x < 65536.
        format: int32
        type: integer
      hostIP:
        description: What host IP to bind the external
          port to.
        type: string
      hostPort:
        description: Number of port to expose on the host.
          If specified, this must be a valid port number,
          0 < x < 65536. If HostNetwork is specified,
          this must match ContainerPort. Most containers
          do not need this.
        format: int32
        type: integer
      name:
        description: If specified, this must be an IANA_SVC_NAME
          and unique within the pod. Each named port in
          a pod must have a unique name. Name for the
          port that can be referred to by services.
        type: string
      protocol:
        description: Protocol for port. Must be UDP, TCP,
          or SCTP. Defaults to "TCP".
        type: string
    required:
    - containerPort
    type: object
  type: array
  x-kubernetes-list-map-keys:
  - containerPort
  - protocol
  x-kubernetes-list-type: map
```

当将此 CRD 应用于 v1.18 Kubernetes 集群时，出现以下错误。

```
Required value: this property is in x-kubernetes-list-map-keys, so it must have a default or be a required property
```

`x-kubernetes-list-map-keys` 中指定的字段必须是必需的或具有默认值，但 `protocol` 字段都不是必需的。

从 Kubernetes 1.18 和controller-gen 0.3.0 开始，此问题尚未解决。 （[参考](https://github.com/kubernetes/kubernetes/issues/91395))

目前，可以通过重写生成的CRD并设置默认值来避免这个问题，如下所示。

```diff
      protocol:
        description: Protocol for port. Must be UDP, TCP,
          or SCTP. Defaults to "TCP".
+       default: TCP
        type: string
```
