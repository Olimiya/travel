# 云南蜜月旅行速查 · 滇西北反向环线8天版

个人旅行速查网站，纯静态（HTML + CSS + JS + 本地 Leaflet），无构建步骤。

## 功能

- 路线地图（Leaflet · 高德底图 · 两方案切换）
- 逐日行程（含驾驶强度表）
- 知识库（住宿/餐饮/交通/高反应对）
- 待办清单（localStorage 持久化勾选）
- 预算对比（两方案并排）
- 景点清单（必去/备选/途经）

## 本地预览

```powershell
cd site
python -m http.server 8765
```

浏览器打开 <http://localhost:8765/>

## 部署

本目录是独立 git 仓库，三种发布方式任选其一。

### 方式一：GitHub Pages（推荐）

1. 在 GitHub 新建仓库，例如 `yunnan-trip`。
2. 推送：
   ```powershell
   cd site
   git init
   git add .
   git commit -m "云南蜜月旅行速查网站"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/yunnan-trip.git
   git push -u origin main
   ```
3. 仓库 Settings → Pages → Source 选 `Deploy from a branch` → Branch 选 `main` / `root` → Save。
4. 1-2 分钟后访问 `https://<你的用户名>.github.io/yunnan-trip/`。

### 方式二：Vercel

1. 推送到 GitHub（同上步骤 1-2）。
2. 登录 <https://vercel.com> → New Project → Import 仓库 → Framework Preset 选 `Other` → Deploy。
3. `vercel.json` 已配置好静态托管和资源缓存，无需改动。
4. 部署完成得到 `https://yunnan-trip.vercel.app`（或自定义域名）。

### 方式三：个人服务器 IPv6 + 反向代理

前提：服务器有公网 IPv6，域名 AAAA 记录指向服务器。

Caddy 配置（最简，自动 HTTPS）：
```caddyfile
trip.example.com {
  root * /var/www/yunnan-trip
  file_server
  encode gzip
  @assets path /assets/*
  header @assets Cache-Control "public, max-age=31536000, immutable"
}
```

Nginx 配置：
```nginx
server {
  listen [::]:80;
  server_name trip.example.com;
  root /var/www/yunnan-trip;
  index index.html;
  location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }
  location / { try_files $uri $uri/ /index.html; }
}
```

部署文件：
```powershell
# 上传（PowerShell，需服务器开放 SSH/SCP）
scp -r site/* user@server:/var/www/yunnan-trip/
```

## 目录结构

```
site/
  index.html              # 主页（6 视图入口）
  vercel.json             # Vercel 静态托管配置
  assets/
    app.css               # 样式
    app.js                # 视图渲染 + 交互
    data.js               # 全部结构化数据（行程/知识/清单/预算/景点）
    leaflet/
      leaflet.js          # 地图库（本地，1.9.4）
      leaflet.css
```

## 更新数据

编辑 `assets/data.js`，改完刷新浏览器即可。所有视图自动重渲染。
勾选状态保存在浏览器 localStorage，按域名隔离。
