# 工商业项目管理原型 · 本地部署说明

## 快速启动

```bash
# 安装依赖（仅首次）
npm install -g serve

# 在 dist 目录下启动静态服务
serve .
```

浏览器访问 `http://localhost:3000` 即可。

---

## 方式二：使用 Python（无需安装依赖）

```bash
# Python 3
python3 -m http.server 8080
```

浏览器访问 `http://localhost:8080`。

---

## 方式三：使用 Node http-server

```bash
npx http-server . -p 8080 -c-1
```

`-c-1` 关闭缓存，适合查看最新改动。

---

## 注意事项

- 本目录为编译产物，**不要直接修改** dist 内的文件
- 源码在项目根目录 `src/` 下，修改后需重新执行 `npx vite build` 更新 dist
- 如需本地开发调试，在项目根目录执行 `npm run dev`

---

## 页面入口

| 路由 | 说明 |
|------|------|
| `/` | 工商业项目管理列表页 |
| 列表页点击行操作 | 跳转各申请页 / 详情页 |

---

## 技术栈

- Vue 3 + TypeScript + Vite
- Ant Design Vue 4.x
- @anfe/vue-pro-components
