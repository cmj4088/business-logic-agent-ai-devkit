# __init__.py — Shared 包初始化模块

## 概述
该文件是 `shared` 包的 **初始化文件**，使 `shared` 目录成为一个 Python 包（package）。当前为空文件，不包含任何导出或初始化逻辑，仅作为包标识存在。

## 作用
- 使 Python 将 `shared/` 目录识别为一个可导入的包
- 其他模块可以通过 `from shared.xxx import ...` 导入 shared 包中的模块
- 如果将来需要在包导入时执行初始化逻辑，可以在此文件中添加

## 注意事项
- 该文件当前为空，但必须存在才能使 `shared` 成为合法的 Python 包
- 如果添加了 `__all__` 列表，可以控制 `from shared import *` 的行为
- 包的公开 API 应由各子模块自行定义，而不是在此集中导出