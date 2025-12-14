---
title: Docker - 使用 Dockerfile 定制镜像
description: 
author: zhang
date: 2025-12-14 08:33:00 +0800
categories: [Docker, 学习笔记]
tags: [Docker, 学习笔记]
pin: false
math: true
mermaid: true
---

## Dockerfile

`Dockerfile`是一个文本文件，其内包含了一条条的 指令(Instruction)，**每一条指令**构建一层，因此每一条指令的内容，就是描述该层应当如何构建。

### From 指令

例如：~/docker-demo/Dockerfile
```
From nginx
RUN echo '<h1>Hello Docker</h1>' > /usr/share/nginx/html/index.html
```

这个Dockerfile以nginx最新版本的镜像最基础，通过RUN语句执行echo命令，建立一层新的只读层。

### RUN 指令

- shell 格式： `RUN <命令>`
- exec 格式：`RUN ["可执行文件", "参数1", "参数2"]`

对于大量的shell命令，应该合理的合并到同一层，并且在结束时要删除掉这一层构建时可能产生的垃圾文件，减少镜像的体积，例如：

```
RUN set -x; buildDeps='gcc libc6-dev make wget' \
    && apt-get update \
    && apt-get install -y $buildDeps \
    && wget -O redis.tar.gz "http://download.redis.io/releases/redis-5.0.3.tar.gz" \
    && mkdir -p /usr/src/redis \
    && tar -xzf redis.tar.gz -C /usr/src/redis --strip-components=1 \
    && make -C /usr/src/redis \
    && make -C /usr/src/redis install \
    && rm -rf /var/lib/apt/lists/* \
    && rm redis.tar.gz \
    && rm -r /usr/src/redis \
    && apt-get purge -y --auto-remove $buildDeps
```

### COPY 指令

从本地构建上下文复制文件/目录到镜像中, `src` 都是指定`相对路径`。如果路径父目录不存在，会自动创建目录。

```
COPY <src> <src> ... <dest>
```

### ADD 指令

支持复制上下文目录的文件/目录，从远程下载文件，或者解压上下文目录里的压缩包到镜像中。如果是只要复制文件，优先用`COPY`。

```
# 1. 复制本地文件（和 COPY 一样）
ADD config.json /app/

# 2. 从 URL 下载（不推荐！）
ADD https://example.com/app.jar /app/app.jar

# 3. 自动解压本地 tar 包
ADD app.tar.gz /opt/   # 会解压到 /opt/app/
```

### 构建镜像

命令：
```
docker build [选项] <上下文路径/URL/->
docker build -t nginx:v10 .
```

`docker build`需要在Dockerfile所在目录下执行。

### 镜像构建上下文

首先了解，镜像构建的工作原理。

- Docker 采用 C/S 架构：
- Docker 命令（CLI）仅是客户端；
- 真正的镜像构建工作由 Docker 引擎（dockerd daemon） 在后台完成；
- 两者通过 API 通信（Linux 上通常是 Unix socket /var/run/docker.sock，Windows 上是命名管道）。

所以表面上是Docker命令在完成任务，其实是`Docker客户端`通过API调用Docker Engine`来完成构建任务的。

当执行`docker build`时，CLI 并不直接读取文件，而是将构建所需的所有材料打包发送给引擎。`docker build`最后一个参数上下文路径不是指`Dockerfile`所在目录。是用户指定的一个本地目录路径（或 URL、标准输入），`Docker CLI` 会将该路径下的所有文件（除 `.dockerignore` 排除外）递归打包成一个 `tar` 流，并上传给`Docker 引擎`。引擎在隔离环境中解压此上下文后，才能访问其中的文件用于 `COPY`、`ADD` 等指令。

### 指定 git 仓库构建镜像

```
docker build -t hello-world:v1 https://github.com/docker-library/hello-world.git#master:amd64/hello-world
```

URL格式是 `<URL>#ref:<dockerfile所在目录>`。这种方式下，上下文路径就是dockerfile所在目录。