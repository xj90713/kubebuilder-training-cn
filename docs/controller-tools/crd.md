# CRD清单生成

为了在控制器中处理自定义资源，您需要为该资源定义 CRD（自定义资源定义）。
CRD 清单很复杂，需要付出相当大的努力来手动创建

因此，Kubebuilder 提供了一个名为controller-gen 的工具，它允许您从用 Go 编写的结构体生成 CRD。

首先，我们看一下`kubebuilder create api`命令生成的`markdownview_types.go`。

[import](../../codes/00_scaffold/api/v1/markdownview_types.go)

定义了结构体 `MarkdownViewSpec`、`MarkdownViewStatus`、`MarkdownView` 和 `MarkdownViewList`，并添加了一些以 `//+kubebuilder:` 开头的标记注释。
controller-gen 依赖这些结构和标记来生成 CRD。

`MarkdownView`是成为自定义资源主体的结构。。`MarkdownViewList`是表示`MarkdownView`列表的结构体。这两种结构基本上不会改变
`MarkdownViewSpec`和`MarkdownViewStatus`是构成`MarkdownView`结构的元素。让我们通过重写这两个结构来定义自定义资源。

通常，自定义资源`Spec`由用户编写，用于将系统所需的状态从用户传达到控制器。
另一方面，`Status`用于将控制器处理的结果传达给用户或其他系统。

## MarkdownViewSpec

重写`MarkdownViewSpec`。

在[要创建的自定义控制器](../introduction/sample.md)中，我们提供了以下清单的示例，作为由 MarkdownView 控制器处理的自定义资源。

[import](../../codes/20_manifests/config/samples/view_v1_markdownview.yaml)

准备一个结构来处理上述清单。

[import:"spec"](../../codes/20_manifests/api/v1/markdownview_types.go)

首先，定义以下三个字段。

- `Markdowns`: 表示要显示的 Markdown 文件列表
- `Replicas`: viewer的副本数量
- `ViewerImage`: 用于显示MarkdownViewer镜像的名称

每个字段上方都写有一个称为标记的注释，以字符串`// +kubebuilder`开头。
这些标记允许您控制生成的 CRD 的内容。

可以使用命令`controller-gen crd -w`检查可以添加的标记。

### Required/Optional

`Markdowns`字段标有`+kubebuiler:validation:Required`的标记。
这个字段说明是必填字段，用户在编写manifest时不能省略。
另一方面`Replicas`和`ViewerImage`被标记为`+optional`，表明此项是可选的。

如果未指定标记，则该字段默认为必填。

通过在文件中放置以下标记，可以将默认行为更改为可选。

```
// +kubebuilder:validation:Optional
```

即使不添加`+Optional`标记，如果在字段后面的JSON标记中添加`omitempty`，它也会自动成为可选字段。

```go
type SampleSpec struct {
	Value string `json:"value,omitempty"`
}
```

对于可选字段，字段类型可以是指针，如下所示。
当清单中未指定值时，这会更改行为。
如果是指针类型，则输入null，如果是实体，则输入该类型的初始值（int为0）。

```go
type SampleSpec struct {
	// +optional
	Value1 int  `json:"value1"`
	// +optional
	Value2 *int `json:"value2"`
}
```

### Validation

Kubebuilder 提供除`Required`之外的各种验证。
请检查`controller-gen crd -w`命令了解详细信息。

- 列表元素的最小数量、元素的最大数量
- 最小和最大字符串长度
- 最小和最大数值
- 是否匹配正则表达式
- 列表中的元素是否唯一

## MarkdownViewStatus

接下来，重写`MarkdownViewStatus`来表达MarkdownView资源的状态。

[import:"status"](../../codes/20_manifests/api/v1/markdownview_types.go)

在这个自定义控制器中，`MarkdownViewStatus`是一个字符串类型，它被用来表示三种状态：`NotReady`、`Available`和`Healthy`。
通过使用`//+kubebuilder:validation:Enum`将无法设置除指定字符串之外的任何值。

## MarkdownView

接下来，我们看一下`MarkdownView`结构中的标记。

[import:"markdown-view"](../../codes/20_manifests/api/v1/markdownview_types.go)

在 Kubebuilder 生成的初始状态中，指定了两个标记：`+kubebuilder:object:root=true` 和 `+kubebuilder:subresource`。
这里我们还将添加 `+kubebuilder:printcolumn`。
  
`+kubebuilder:object:root=true` 是一个标记，指示 `MarkdownView` 结构是自定义资源的根对象。

下面将解释 `+kubebuilder:subresource` 和 `+kubebuilder:printcolumn` 标记。

### subresource

添加标记 `+kubebuilder:subresource:status` 将导致 `status` 字段被视为子资源。

在Kubernetes中，所有资源都有独立的API端点，可以通过API服务器获取、创建、修改和删除资源。

启用子资源将导致`status`字段具有独立于主资源的 API 端点

这使得可以仅检索和更新`status`，而不必检索和更新整个主资源。
但是，由于它们只是属于主资源的子资源，因此无法单独创建或删除它们

基本上，将`status`设为子资源是一个好主意，因为可以明确写入`spec`字段的用户和写入`status`字段的控制器之间的角色划分。
此外，在 Kubebuilder v3 中，子资源的`status`字段指定的标记现在从一开始就指定了。

CRD 不允许任何字段作为子资源，仅支持两个字段：`status` 和 `scale`。

### printcolumn

通过添加 `+kubebuilder:printcolumn` 标记，您可以指定使用 kubectl 检索自定义资源时要显示的列

可以使用 JSONPath 指定要显示的字段。
例如，如果编写 `JSONPath=".spec.replicas"`，则执行 kubectl get 时将显示 `.spec.replicas` 的值。

当您使用 kubectl 检索 MarkdownView 资源时，可以确认 REPLICAS 和 STATUS 值显示如下所示。

```
$ kubectl get markdownview
NAME                  REPLICAS   STATUS
MarkdownView-sample   1          healthy
```

## 生成CRD清单

最后，让我们从用 Go 编写的结构体生成一个 CRD

请运行以下命令。

```console
$ make manifests
```

然后，将生成如下所示的 CRD 清单文件。

[import](../../codes/20_manifests/config/crd/bases/view.zoetrope.github.io_markdownviews.yaml)
