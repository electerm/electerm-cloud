<h1 align="center" style="padding-top: 60px;padding-bottom: 40px;">
    <a href="https://electerm.org">
        <img src="https://github.com/electerm/electerm-resource/raw/master/static/images/electerm.png", alt="" />
    </a>
</h1>

[English](README.md) | [中文](README.cn.md)

# electerm-cloud

A data sync site for [electerm](https://github.com/electerm/electerm) users.

Store and sync your electerm data (settings, bookmarks, connection history, etc.) securely in the cloud, and access them across all your devices.

## Features

- **Data sync** — securely store and retrieve your electerm sync data in the cloud
- **End-to-end encryption** — optionally set a sync password in electerm; bookmarks and profiles are encrypted with AES-256-GCM in the client before upload, so the server only ever stores ciphertext
- **Account** — sign in to manage your synced data

## About electerm

Open-sourced terminal/ssh/sftp/telnet/serialport/RDP/VNC/Spice/ftp client(Linux, Mac, Windows, Android, HarmonyOS, iOS).

Besides mainstream Windows/macOS/Linux/Android, electerm also supports HarmonyOS, iOS, and older systems — Ubuntu 18, Windows 7, macOS 10+, and special Chinese Linux distributions such as UOS, Kylin, and LoongArch (both old-world and new-world).

<p>
  <a href="https://electerm.org">Homepage / Downloads</a> ·
  <a href="https://theme.electerm.org">Theme</a> ·
  <a href="https://github.com/electerm/electerm-web-docker">Docker</a> ·
  <a href="https://demo.electerm.org">Online demo</a> ·
  <a href="https://github.com/electerm/electerm-android">Android</a> ·
  <a href="https://github.com/electerm/electerm-harmony">HarmonyOS</a> ·
  <a href="https://apps.apple.com/cn/app/electerm/id6792971552">Apple App Store</a> ·
  <a href="https://appgallery.huawei.com/app/detail?id=org.electerm.electerm">Huawei AppGallery</a> ·
  <a href="https://www.microsoft.com/store/apps/9NCN7272GTFF">Microsoft Store</a> ·
  <a href="https://snapcraft.io/electerm">Snap Store</a> ·
  <a href="https://repos.electerm.org/deb">deb repo</a> ·
  <a href="https://repos.electerm.org/rpm">rpm repo</a>
</p>

<div>🌐 <strong><a href="https://cloud.electerm.org">electerm online</a></strong> — Public free online electerm app</div>
<div>🤖 <strong><a href="https://ai.electerm.org">electerm AI</a></strong> — Free AI for electerm users</div>
<div>💻 <strong><a href="https://github.com/electerm/electerm-web">electerm-web</a></strong> — Web app version running in browser (including mobile device)</div>

## Local development & testing

Requires Node.js and Java (for DynamoDB Local).

```bash
cp sample.env .env        # fill in JWT_SECRET, ADMIN_GITHUB_LOGIN, TEST_TOKEN
npm i

npm run db                # downloads DynamoDB Local into bin/ and starts it on port 8000
npm run ct                # creates the 5 tables (User/AdminUser/Token/Data/Statics)
npm run seed              # creates admin user + statics + a test user/token matching TEST_TOKEN

npm run c                 # dev server on http://127.0.0.1:5678
npm test                  # jest: unit tests + e2e sync test against the local stack
```

Useful scripts: `npm run init` (create admin user), `npm run st` (init statics), `npm run adu` (add test users), `npm run cl` (clean orphaned records, needs `ALLOW_DESTRUCTIVE=true`), `npm run cdb` (wipe all tables, needs `ALLOW_DESTRUCTIVE=true`), `npm run db-stop` (stop DynamoDB Local).

## License

[MIT](LICENSE)
