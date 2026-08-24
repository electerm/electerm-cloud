<h1 align="center" style="padding-top: 60px;padding-bottom: 40px;">
    <a href="https://electerm.org">
        <img src="https://github.com/electerm/electerm-resource/raw/master/static/images/electerm.png", alt="" />
    </a>
</h1>

[English](README.md) | [中文](README.cn.md)

# electerm-cloud

[electerm](https://github.com/electerm/electerm) 用户的数据云服务 —— 支撑 [cloud.electerm.org](https://cloud.electerm.org) 的后端与 Web 应用。

electerm-cloud 为 electerm 用户提供账号管理、数据同步与 AI 能力，让你的设置、书签与连接历史等数据安全地存储在云端，并可在所有设备间同步访问。

## 功能特性

- **账号与 GitHub 登录** —— 使用 GitHub 账号登录并管理你的云端资料
- **数据同步** —— 将你的 electerm 同步数据（设置、书签、连接历史等）安全地存储与读取
- **管理后台** —— 内置管理界面，用于管理用户与站点静态数据
- **AI 能力** —— 为 electerm 用户提供的 AI 功能（见 `src/static/ai.txt`）
- **多语言界面** —— 国际化的用户界面
- **Web 页面** —— 使用 Pug 渲染的首页、协议页与隐私页

## 技术栈

- **TypeScript** —— 主要开发语言
- **React + Ant Design** —— 前端 UI
- **Vite** —— 构建工具与开发服务器
- **Express** —— 本地开发服务器
- **Vercel Serverless Functions**（`api/`）—— 生产环境后端，部署于 Vercel
- **DynamoDB**（`dynamoose`）与 **MongoDB**（`mongoose`）—— 数据存储
- **JSON Web Tokens** —— 身份认证
- **Pug** —— 服务端页面模板
- **Stylus** —— CSS 预处理

## 项目结构

```
api/            Vercel 无服务器函数（sync、user、admin、auth 等）
src/
  client/       React 前端（admin、login、me 等）
  data/         数据处理（agreement、landing、privacy 等）
  server/       服务端逻辑（control、models、views）
  static/       静态资源（图标、ai.txt、robots.txt 等）
  styles/       Stylus 样式
  views/        Pug 模板（index、landing、agreement、privacy、404）
bin/            构建与管理脚本、本地 DynamoDB 辅助脚本
```

## 本地开发

```bash
# 安装依赖
npm install

# （可选）启动本地 DynamoDB 用于开发
npm run db

# 复制示例环境变量文件并填写所需配置
cp sample.env .env

# 启动 Vercel 开发服务器（无服务器函数）
npm run d

# 或启动 Vite 开发服务器（前端）
npm run c
```

## 环境变量

将 `sample.env` 复制为 `.env` 并填写所需配置：

| 变量 | 说明 |
|---|---|
| `CLIENT_ID` / `CLIENT_SECRET` | GitHub OAuth 应用凭据（开发环境） |
| `CLIENT_ID_PROD` / `CLIENT_SECRET_PROD` | GitHub OAuth 应用凭据（生产环境） |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` | DynamoDB 所需的 AWS 凭据与区域 |
| `DYNAMODB_ENDPOINT_URL` | DynamoDB 端点（本地 DynamoDB 设为 `http://localhost:8000`） |
| `DYNAMO_TABLE_PREFIX` | DynamoDB 表名前缀 |
| `JWT_SECRET` | 用于签发认证 JWT 的密钥 |
| `ADMIN_USER` / `ADMIN_PASS` | 本地管理员凭据 |
| `ADMIN_USER_PROD` / `ADMIN_PASS_PROD` | 生产环境管理员凭据 |
| `ADMIN_GITHUB_LOGIN` | 被授予管理员权限的 GitHub 账号 |
| `ADMIN_INIT_DOMAIN` / `ADMIN_INIT_DOMAIN_PROD` | 管理初始化域名（本地 / 生产） |
| `TEST_TOKEN` | 自动化测试使用的令牌 |

## 部署

electerm-cloud 运行于 [Vercel](https://vercel.com)。`api/` 目录部署为无服务器函数，前端使用 Vite 构建。

```bash
# 构建并部署到生产环境
npm run pub        # 等价于：npm run b && vercel --prod
```

## 关于 electerm

开源终端/ssh/telnet/serialport/RDP/VNC/Spice/sftp/ftp客户端(Linux, Mac, Windows, Android, HarmonyOS)。

除了主流的 Windows/macOS/Linux/Android，electerm 还支持鸿蒙(HarmonyOS)，以及老旧系统——如 Ubuntu 18、Windows 7、macOS 10+，以及国产特殊 Linux 发行版如 UOS、麒麟(Kylin)、龙芯(LoongArch，含旧世界与新世界)。

<p>
  <a href="https://electerm.org">主页 / 下载</a> ·
  <a href="https://theme.electerm.org">主题</a> ·
  <a href="https://github.com/electerm/electerm-web-docker">Docker</a> ·
  <a href="https://demo.electerm.org">在线演示</a> ·
  <a href="https://github.com/electerm/electerm-android">Android</a> ·
  <a href="https://github.com/electerm/electerm-harmony">鸿蒙</a> ·
  <a href="https://appgallery.huawei.com/app/detail?id=org.electerm.electerm">华为应用市场</a> ·
  <a href="https://www.microsoft.com/store/apps/9NCN7272GTFF">微软商店</a> ·
  <a href="https://snapcraft.io/electerm">Snap 商店</a> ·
  <a href="https://repos.electerm.org/deb">deb 仓库</a> ·
  <a href="https://repos.electerm.org/rpm">rpm 仓库</a>
</p>

<div>🌐 <strong><a href="https://cloud.electerm.org">electerm 在线版</a></strong> — 公共免费在线 electerm 应用</div>
<div>🤖 <strong><a href="https://ai.electerm.org">electerm AI</a></strong> — 免费为 electerm 用户提供 AI</div>
<div>💻 <strong><a href="https://github.com/electerm/electerm-web">electerm-web</a></strong> — 运行于浏览器(支持移动设备)的 web app 版本</div>

## 许可证

[MIT](LICENSE)
