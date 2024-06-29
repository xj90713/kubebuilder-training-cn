# Kubebuilder制作和学习

在本文档中，您将学习如何使用Kuberbuilder开发自定义控制器/运营商。

## 什么是Kubebuilder？

KubeBuilder是开发自定义控制器/操作员扩展Kubernetes的框架。

Kubernetes可以使用部署和服务等资源轻松地提供应用程序部署和服务。
除了使用标准资源外，用户还可以定义自己的自定义资源并扩展Kubernetes。
处理此自定义资源的程序称为自定义控制器。
用于使用自定义控制器自动化其软件设置和操作的程序称为操作员。

实施自定义控制器和运营商的示例包括以下内容：


- [cert-manager](https://cert-manager.io/docs/)
- [MOCO](https://github.com/cybozu-go/moco)

Cert-Manager是一个自定义控制器，可以使用自定义资源（例如证书资源和ISER资源）自动化证书问题。
MoCo是使用MySQLCluster资源和backuppolicy Resources构建MySQL群集和管理自动备份的管理。

通过Kubebuilder、client-go您可以通过提供自动生成易于使用和抽象的清单来轻松开发自定义控制器（crd）。

KubeBuilder由以下工具和库组成。

- [kubebuilder](https://github.com/kubernetes-sigs/kubebuilder)
  - 生成自定义控制器项目模板的工具
- [controller-tools](https://github.com/kubernetes-sigs/controller-tools)
  - 从GO源代码生成清单的工具
- [controller-runtime](https://github.com/kubernetes-sigs/controller-runtime)
  - 用于实现自定义控制器的框架库

通过这个文档，我们将学习如何使用这些工具实现自定义控制器。

## 兼容版本

* Kubebuilder: v3.11.1
* controller-tools: v0.12.0
* controller-runtime: v0.15.0

## 更改日志

* 2020/07/30: 第一版出版
* 2021/04/29: Kubebuilder V3兼容
* 2021/07/25: 将样本更改为MarkdownView Controller并查看整个文本
* 2022/06/20: Kubebuilder v3.4.1兼容
* 2022/07/18: Kubebuilder v3.5.0兼容，审查样本代码
* 2023/08/29: KubeBuilder v3.11.1兼容
