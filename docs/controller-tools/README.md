# controller-tools

Kubebuilder 提供了 [controller-tools](https://github.com/kubernetes-sigs/controller-tools) 作为一组工具来协助开发自定义控制器。

controller-tools 包括以下工具，但本文档仅涉及controller-gen。

- controller-gen
- type-scaffold
- helpgen

##  controller-gen

`controller-gen` 是一个基于 Go 源码生成清单和 Go 源码的工具。
如果您检查`controller-gen`帮助，您将看到以下五种类型的生成器的存在。

```
❯ controller-gen -h

(中略)

generators

+webhook                                                                                                  package  generates (partial) {Mutating,Validating}WebhookConfiguration objects.
+schemapatch:manifests=<string>[,maxDescLen=<int>]                                                        package  patches existing CRDs with new schemata.
+rbac:roleName=<string>                                                                                   package  generates ClusterRole objects.
+object[:headerFile=<string>][,year=<string>]                                                             package  generates code containing DeepCopy, DeepCopyInto, and DeepCopyObject method implementations.
+crd[:crdVersions=<[]string>][,maxDescLen=<int>][,preserveUnknownFields=<bool>][,trivialVersions=<bool>]  package  generates CustomResourceDefinition objects.
```

`kubebuilder` 生成的 Makefile 有目标 `make manifests` 和 `make generate`，`make manifests` 生成 `webhook`、`rbac`、`crd` 和 `make generate`生成 `object`

当`controller-gen`生成清单时，它使用Go的结构和注释（称为标记）的结构，以嵌入源代码中的`// +kubebuilder:`开头作为地标。

您可以使用以下命令检查可用的标记。（您可以通过指定`-ww`或`-www`看到更详细的解释）

```console
$ controller-gen crd -w
$ controller-gen webhook -w
```
