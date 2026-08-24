<h1 align="center" style="padding-top: 60px;padding-bottom: 40px;">
    <a href="https://electerm.org">
        <img src="https://github.com/electerm/electerm-resource/raw/master/static/images/electerm.png", alt="" />
    </a>
</h1>

[English](README.md) | [中文](README.cn.md)

# electerm-cloud

Data cloud service for [electerm](https://github.com/electerm/electerm) users — the backend and web application behind [cloud.electerm.org](https://cloud.electerm.org).

electerm-cloud provides account management, data synchronization, and AI features for electerm users, so your settings, bookmarks, and connection history can be securely stored in the cloud and accessed across all your devices.

## Features

- **Account & GitHub login** — sign in with your GitHub account and manage your cloud profile
- **Data sync** — securely store and retrieve your electerm sync data (settings, bookmarks, connection history, etc.) in the cloud
- **Admin panel** — built-in admin interface to manage users and site statics
- **AI capabilities** — AI features for electerm users (see `src/static/ai.txt`)
- **Multi-language UI** — internationalized interface
- **Web pages** — landing, agreement, and privacy pages rendered with Pug

## Tech Stack

- **TypeScript** — primary language
- **React + Ant Design** — frontend UI
- **Vite** — build tool and dev server
- **Express** — local development server
- **Vercel Serverless Functions** (`api/`) — production backend, deployed on Vercel
- **DynamoDB** (via `dynamoose`) and **MongoDB** (via `mongoose`) — data storage
- **JSON Web Tokens** — authentication
- **Pug** — server-side page templates
- **Stylus** — CSS preprocessing

## Project Structure

```
api/            Vercel serverless functions (sync, user, admin, auth, ...)
src/
  client/       React frontend (admin, login, me, ...)
  data/         data handling (agreement, landing, privacy, ...)
  server/       server logic (control, models, views)
  static/       static assets (icons, ai.txt, robots.txt, ...)
  styles/       Stylus stylesheets
  views/        Pug templates (index, landing, agreement, privacy, 404)
bin/            build & admin scripts, local DynamoDB helpers
```

## Local Development

```bash
# Install dependencies
npm install

# (Optional) start a local DynamoDB instance for development
npm run db

# Copy the sample env file and fill in the required values
cp sample.env .env

# Start the Vercel dev server (serverless functions)
npm run d

# Or start the Vite dev server (frontend)
npm run c
```

## Environment Variables

Copy `sample.env` to `.env` and configure the required values:

| Variable | Description |
|---|---|
| `CLIENT_ID` / `CLIENT_SECRET` | GitHub OAuth app credentials (development) |
| `CLIENT_ID_PROD` / `CLIENT_SECRET_PROD` | GitHub OAuth app credentials (production) |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` | AWS credentials and region for DynamoDB |
| `DYNAMODB_ENDPOINT_URL` | DynamoDB endpoint (set to `http://localhost:8000` for local DynamoDB) |
| `DYNAMO_TABLE_PREFIX` | Prefix for DynamoDB table names |
| `JWT_SECRET` | Secret used to sign authentication JWTs |
| `ADMIN_USER` / `ADMIN_PASS` | Local admin credentials |
| `ADMIN_USER_PROD` / `ADMIN_PASS_PROD` | Production admin credentials |
| `ADMIN_GITHUB_LOGIN` | GitHub login granted admin access |
| `ADMIN_INIT_DOMAIN` / `ADMIN_INIT_DOMAIN_PROD` | Admin init domain (local / production) |
| `TEST_TOKEN` | Token used in automated tests |

## Deployment

electerm-cloud runs on [Vercel](https://vercel.com). The `api/` directory is deployed as serverless functions and the frontend is built with Vite.

```bash
# Build and deploy to production
npm run pub        # equivalent to: npm run b && vercel --prod
```

## About electerm

Open-sourced terminal/ssh/sftp/telnet/serialport/RDP/VNC/Spice/ftp client(Linux, Mac, Windows, Android, HarmonyOS).

Besides mainstream Windows/macOS/Linux/Android, electerm also supports HarmonyOS, and older systems — Ubuntu 18, Windows 7, macOS 10+, and special Chinese Linux distributions such as UOS, Kylin, and LoongArch (both old-world and new-world).

<p>
  <a href="https://electerm.org">Homepage / Downloads</a> ·
  <a href="https://theme.electerm.org">Theme</a> ·
  <a href="https://github.com/electerm/electerm-web-docker">Docker</a> ·
  <a href="https://demo.electerm.org">Online demo</a> ·
  <a href="https://github.com/electerm/electerm-android">Android</a> ·
  <a href="https://github.com/electerm/electerm-harmony">HarmonyOS</a> ·
  <a href="https://appgallery.huawei.com/app/detail?id=org.electerm.electerm">Huawei AppGallery</a> ·
  <a href="https://www.microsoft.com/store/apps/9NCN7272GTFF">Microsoft Store</a> ·
  <a href="https://snapcraft.io/electerm">Snap Store</a> ·
  <a href="https://repos.electerm.org/deb">deb repo</a> ·
  <a href="https://repos.electerm.org/rpm">rpm repo</a>
</p>

<div>🌐 <strong><a href="https://cloud.electerm.org">electerm online</a></strong> — Public free online electerm app</div>
<div>🤖 <strong><a href="https://ai.electerm.org">electerm AI</a></strong> — Free AI for electerm users</div>
<div>💻 <strong><a href="https://github.com/electerm/electerm-web">electerm-web</a></strong> — Web app version running in browser (including mobile device)</div>

## License

[MIT](LICENSE)
