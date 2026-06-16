# 王者英雄消消乐 Web App

一个可直接静态部署的消消乐 Web App。使用真实英雄名称与头像 URL，支持拖拽相邻头像交换、三连检测、消除、下落补位、计分、目标收集、提示、重排和斩击。

## 运行

```powershell
& 'C:\Users\86155\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m http.server 5179 --bind 127.0.0.1 --directory outputs/king-match3-web-app
```

打开：

```text
http://127.0.0.1:5179/
```

## 自动化测试

```powershell
$env:NODE_PATH='C:\Users\86155\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\.pnpm\node_modules;C:\Users\86155\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
& 'C:\Users\86155\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' work/test-web-app.js
```

测试覆盖：

- 页面加载与标题检查
- 49 个棋盘格渲染
- 初始棋盘无天然三连
- 提示按钮高亮两枚可交换头像
- 强制三连检测
- 相邻交换后消除、计分、扣步
- 移动端无横向溢出
- 控制台无错误
