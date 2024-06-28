# CRD的版本控制

版本控制是一个复杂的问题。

例如，如果对CRD进行了不向后兼容的更改，
那么使用自定义控制器的用户将不得不删除自定义资源。
这可能导致服务停止，且非常费时，有些情况下即使有不同类型的控制器，数据也可能会丢失。

必须以向后兼容的方式进行更改。

在本文档中，到目前为止我们创建的自定义资源类似于以下内容：

```yaml
apiVersion: multitenancy.example.com/v1
kind: Tenant
metadata:
  name: example-tenant
spec:
  namespace: example
  admin: admin-username
```

就像添加字段一样，

```yaml
apiVersion: multitenancy.example.com/v1
kind: Tenant
metadata:
  name: example-tenant
spec:
  namespace: example
  admin: admin-username
  age: 30
```

admin字段目前只能指定一个值，但我们希望能够指定多个值，

```yaml
apiVersion: multitenancy.example.com/v1
kind: Tenant
metadata:
  name: example-tenant
spec:
  namespace: example
  admins:
    - admin-username1
    - admin-username2
```

在用户眼中，同时存在admin和admins字段可能会令人困惑。
因此，我们希望将它们合并为admins字段。
由于这种改变会导致不兼容性，我们需要将apiVersion更改为v2，并创建转换webhook来处理这些更改。

```yaml
apiVersion: multitenancy.example.com/v2
kind: Tenant
metadata:
  name: example-tenant
spec:
  namespace: example
  admins:
    - admin-username1
    - admin-username2
```

接下来，您可以准备一个转换webhook来处理v1到v2之间的转换。
