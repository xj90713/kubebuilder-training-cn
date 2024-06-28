# API模版创建

`kubebuilder create api`可以使用这个命令实现自定义资源和自定义控制器的模版。

执行如下命令可以生成`MarkdownView`的自定义资源以及处理`MarkdownView`的自定义控制器。

过程中会询问您是否要生成自定义资源和控制器的源代码。这次，请两者都回答“y”。


```console
$ kubebuilder create api --group view --version v1 --kind MarkdownView
Create Resource [y/n]
y
Create Controller [y/n]
y
$ make manifests
```

`--group`,`--version`, `--kind`选项指定要生成的自定义资源的组(Group)、版本(Version)和类型(Kind)
- `--kind`: 指定要创建的资源的名称。
- `--group`: 指定资源所属的组名。
- `--version`: 指定适当的版本。如果未来规范可能会更改，请指定 `v1alpha1` 或 `v1beta1`。如果要创建稳定版本的资源，请指定 `v1`。

成功执行命令后，将生成类似以下的新文件：

```
├── api
│    └── v1
│        ├── groupversion_info.go
│        ├── markdownview_types.go
│        └── zz_generated.deepcopy.go
├── config
│    ├── crd
│    │    ├── bases
│    │    │    └── view.zoetrope.github.io_markdownviews.yaml
│    │    ├── kustomization.yaml
│    │    ├── kustomizeconfig.yaml
│    │    └── patches
│    │        ├── cainjection_in_markdownviews.yaml
│    │        └── webhook_in_markdownviews.yaml
│    ├── rbac
│    │    └── role.yaml
│    └── samples
│        ├── kustomization.yaml
│        └── view_v1_markdownview.yaml
└── internal
    └── controller
        ├── markdownview_controller.go
        └── suite_test.go
```

来看下每个文件的内容。

## api/v1

`markdownview_types.go`这是`MarkdownView`资源在Go语言中的结构表示。
在以后的开发过程中，如果需要修改`MarkdownView`资源的定义，将会编辑这个文件。


`groupversion_info.go`初次生成之后无需编辑此文件。
`zz_generated.deepcopy.go`是根据`markdownview_types.go`的内容自动生成的，因此无需编辑它。

## internal/controllers

`markdownview_controller.go`这个文件包含了自定义控制器的主要逻辑。
以后，在自定义控制器的处理逻辑将主要在这个文件进行开发。

`suite_test.go`这是测试代码。详细内容请参考[Controller测试](../controller-runtime/controller_test.md)

## cmd/main.go

`cmd/main.go`中，添加了如下的控制器的初始化逻辑：

[import:"init-reconciler",unindent="true"](../../codes/00_scaffold/cmd/main.go)

## config

config目录下添加了几个文件。

### crd

CRD（Custom Resource Definition，自定义资源定义）的清单文件已添加到 crd 目录中。

这些清单是从 `api/v1/markdownView_types.go` 自动生成的，因此通常不需要手动编辑它们。
然而，如果您希望使用`Conversion Webhook`，请修改`kustomization.yaml`，使用`cainjection_in_markdownViews.yaml`和`webhook_in_markdownViews.yaml`中的补丁。

### rbac

`role.yaml`文件中，添加了处理`MarkdownView`资源所需的权限设置。

### samples

这是一个自定义资源的示例清单。
可以将其用于测试的目的，或者提供给用户使用。
