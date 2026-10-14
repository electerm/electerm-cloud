<h1 align="center" style="padding-top: 60px;padding-bottom: 40px;">
    <a href="https://electerm.org">
        <img src="https://github.com/electerm/electerm-resource/raw/master/static/images/electerm.png", alt="" />
    </a>
</h1>

[English](README.md) | [中文](README.cn.md)

# electerm-cloud

[electerm](https://github.com/electerm/electerm) 用户的数据同步站点。

将你的 electerm 数据（设置、书签、连接历史等）安全地存储在云端并同步，可在所有设备间访问。

## 功能特性

- **数据同步** —— 将你的 electerm 同步数据安全存储在云端并读取
- **端到端加密** —— 可在 electerm 中设置同步密码，书签和登录配置会在客户端以 AES-256-GCM 加密后再上传，服务端只存储密文
- **账号** —— 登录以管理你的同步数据

## 关于 electerm

开源终端/ssh/telnet/serialport/RDP/VNC/Spice/sftp/ftp客户端(Linux, Mac, Windows, Android, HarmonyOS, iOS)。

除了主流的 Windows/macOS/Linux/Android，electerm 还支持鸿蒙(HarmonyOS)、iOS，以及老旧系统——如 Ubuntu 18、Windows 7、macOS 10+，以及国产特殊 Linux 发行版如 UOS、麒麟(Kylin)、龙芯(LoongArch，含旧世界与新世界)。

<p>
  <a href="https://electerm.org">主页 / 下载</a> ·
  <a href="https://theme.electerm.org">主题</a> ·
  <a href="https://github.com/electerm/electerm-web-docker">Docker</a> ·
  <a href="https://demo.electerm.org">在线演示</a> ·
  <a href="https://github.com/electerm/electerm-android">Android</a> ·
  <a href="https://github.com/electerm/electerm-harmony">鸿蒙</a> ·
  <a href="https://apps.apple.com/cn/app/electerm/id6792971552">苹果应用商店</a> ·
  <a href="https://appgallery.huawei.com/app/detail?id=org.electerm.electerm">华为应用市场</a> ·
  <a href="https://www.microsoft.com/store/apps/9NCN7272GTFF">微软商店</a> ·
  <a href="https://snapcraft.io/electerm">Snap 商店</a> ·
  <a href="https://repos.electerm.org/deb">deb 仓库</a> ·
  <a href="https://repos.electerm.org/rpm">rpm 仓库</a>
</p>

<div>🌐 <strong><a href="https://cloud.electerm.org">electerm 在线版</a></strong> — 公共免费在线 electerm 应用</div>
<div>🤖 <strong><a href="https://ai.electerm.org">electerm AI</a></strong> — 免费为 electerm 用户提供 AI</div>
<div>💻 <strong><a href="https://github.com/electerm/electerm-web">electerm-web</a></strong> — 运行于浏览器(支持移动设备)的 web app 版本</div>

## 本地开发与测试

需要 Node.js 和 Java（DynamoDB Local 依赖 Java）。

```bash
cp sample.env .env        # 填写 JWT_SECRET、ADMIN_GITHUB_LOGIN、TEST_TOKEN
npm i

npm run db                # 下载 DynamoDB Local 到 bin/ 并启动（端口 8000）
npm run ct                # 创建 5 张表（User/AdminUser/Token/Data/Statics）
npm run seed              # 创建管理员用户、统计计数，以及与 TEST_TOKEN 匹配的测试用户与 token

npm run c                 # 开发服务器 http://127.0.0.1:5678
npm test                  # jest：单元测试 + 基于本地环境的 e2e 同步测试
```

常用脚本：`npm run init`（创建管理员用户）、`npm run st`（初始化统计）、`npm run adu`（添加测试用户）、`npm run cl`（清理孤立数据，需 `ALLOW_DESTRUCTIVE=true`）、`npm run cdb`（清空所有表，需 `ALLOW_DESTRUCTIVE=true`）、`npm run db-stop`（停止 DynamoDB Local）。

## 许可证

[MIT](LICENSE)
