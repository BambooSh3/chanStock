# 基础镜像，使用 Node.js 作为基础环境
FROM node:20 as build

# 设置工作目录
WORKDIR /app

# 将 package.json 和 package-lock.json 复制到工作目录
COPY package*.json ./

# 安装项目依赖
RUN npm install

# 将项目的所有文件复制到工作目录
COPY tsconfig.json ./
COPY public public/
COPY src src/

# 构建生产环境的 React 应用
RUN npm run build

# 使用轻量级的 Nginx 镜像来运行静态文件
FROM nginx:alpine

# 复制构建好的 React 应用到 Nginx 的默认静态文件目录
COPY --from=build /app/build /usr/share/nginx/html

# 暴露 Nginx 默认的 HTTP 端口
EXPOSE 80

# 启动 Nginx 服务
CMD ["nginx", "-g", "daemon off;"]
