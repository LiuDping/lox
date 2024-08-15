## 简介

[craftinginterpreters](https://github.com/munificent/craftinginterpreters)中jlox对应的Typescript实现版本。使用[bun](https://bun.sh/)开发环境。


## 使用步骤

### 安装bun

请到[bun官网](https://bun.sh/)按照安装提示安装bun环境。

### 拉取代码

```bash
git clone https://github.com/LiuDping/tslox.git
```

### 安装依赖

```bash
bun install
```

### 运行

```bash
bun run index.ts  // 提供repl方式

bun run index.ts ./example/varTest.lox // 运行文件代码
```

> 也可以用bun将项目打包成一个二进制文件lox，然后可以用lox ./example/varTest.lox 运行代码
