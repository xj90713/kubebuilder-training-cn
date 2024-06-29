# 生成 RBAC 清单

在Kubernetes中，RBAC（基于角色的访问控制）可以控制资源访问。
自定义控制器还需要设置适当的权限，以便它们只能访问它们使用的资源。

controller-gen 可以根据 Go 源代码中嵌入的标记生成 RBAC 清单。

首先，我们看一下 Kubebuilder 生成的标记。

[import:"rbac"](../../codes/00_scaffold/internal/controller/markdownview_controller.go)

- `groups`: 指定您想要授予权限的资源的 API 组。
- `resources`: 指定您要授予权限的资源类型。
- `verb`: 指定授予何种权限。根据控制器执行的操作指定权限。

权限被授予 MarkdownView 资源及其子资源`status`和`finalizer`。
请注意，子资源不能用于列表、创建或删除操作，因此仅授予`get;update;patch`权限。

除此之外，我们还可以添加权限标记来操作 MarkdownView 控制器创建的 ConfigMap、Deployment、Service 和 Event 资源。

[import:"rbac"](../../codes/20_manifests/internal/controller/markdownview_controller.go)

请注意，即使使用 Get 获取资源，控制器运行时提供的 Client 也会在幕后调用 List 和 Watch。
因此，即使您只想获取，也要确保允许获取、列出和观看。

当您运行`make manifests`时，`config/rbac/role.yaml`将更新，如下所示

[import](../../codes/20_manifests/config/rbac/role.yaml)
