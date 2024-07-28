import React from 'react'

function AgreementCn (): JSX.Element {
  return (
    <div>
      <p>
        使用本应用程序即表示您同意以下条款和条件。本应用程序允许您使用GitHub帐户登录并同步您的electerm数据。
      </p>
      <p>
        请注意，我们不保证您的数据会被安全保管。您使用本应用程序的风险由您自行承担。我们对您的数据的任何丢失、损坏或泄露不承担责任。
      </p>
      <p>
        我们保留随时修改本协议的权利，恕不另行通知。您有责任定期查看这些条款。
      </p>
      <p>
        如果您不同意这些条款，请不要使用本应用程序。点击"使用GitHub登录"，即表示您确认已阅读、理解并同意受这些条款和条件的约束。
      </p>
    </div>
  )
}

function AgreementEn (): JSX.Element {
  return (
    <div>
      <p>
        By using this application, you agree to these terms and conditions. This application allows you to log in with your GitHub account and sync your data.
      </p>
      <p>
        Please be aware that we do not promise that your data will be kept safe. You use this application at your own risk. We are not responsible for any loss, corruption, or exposure of your data.
      </p>
      <p>
        We reserve the right to modify this agreement at any time without prior notice. It is your responsibility to review these terms periodically.
      </p>
      <p>
        If you do not agree with these terms, please do not use this application. By clicking "Login with GitHub", you acknowledge that you have read, understood, and agree to be bound by these terms and conditions.
      </p>
    </div>
  )
}

export default function AgreeMent (): JSX.Element {
  return (
    <div>
      <h1>Agreement</h1>
      <AgreementEn />
      <h1>使用协议</h1>
      <AgreementCn />
    </div>
  )
}
