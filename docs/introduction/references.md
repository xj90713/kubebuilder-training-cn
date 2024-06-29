# 参考信息

## 参考资料

本资料省略了许多内容。如果想了解更多的详情，请参考如下资料。

- [The Kubebuilder Book](https://book.kubebuilder.io/)
  - 这是`kubebuilder`的官方文档
- [实践入门Kubernetes自定义控制器之路](https://nextpublishing.jp/book/11389.html)
  - 这本书广泛而易懂地解释了创建自定义控制器所需的知识。
  - 这本书详细解释了如何使用 client-go、Kubebuilder 和 Operator SDK 实现控制器。
- [Programming Kubernetes](https://learning.oreilly.com/library/view/programming-kubernetes/9781492047094/)
  - 在开发控制器时需要的一些关键技术，如 client-go 和自定义资源（Custom Resources）。这是一本详细解释`Kubernetes`构成要素的书籍。
- [Zenn - Zoetro文章列表](https://zenn.dev/zoetro)
  - 本资料中的补充内容包括如何在 Reconcile 循环中使用 Server Side Apply，以及 controller-runtime 的日志记录功能等。

## 参考实现

本资料介绍的技术是参考了如下项目中实际使用的内容。如果感兴趣，请务必阅读其代码。

- [TopoLVM](https://github.com/topolvm/topolvm)
  - 实现了LVM进行动态供给的CSI插件
- [MOCO](https://github.com/cybozu-go/moco)
  - 自动化构建mysql集群的operator
- [Coil](https://github.com/cybozu-go/coil)
  - CNI（Container Network Interface）插件
- [Accurate](https://github.com/cybozu-go/accurate)
  - 用于管理子命名空间（Subnamespace）和资源传播的控制器
- [Pod Security Admission](https://github.com/cybozu-go/pod-security-admission)
  - 应用于 Pod 安全相关策略的`Admission WebHook`实现
