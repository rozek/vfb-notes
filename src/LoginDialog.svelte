<style>
  .LoginDialog {
    display:inline-block; position:relative;
    width:300px; height:auto;
    margin:0px; margin-top:-10px;
    border:none; border-radius:8px;
    padding:10px;
    box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);
    background-color:white;
  }

  .LoginDialog a, .LoginDialog a:visited {
    color:#2980B9;
    text-decoration:underline;
  }

  .LoginDialog > div {
    display:flex; position:relative;
    flex-flow:column nowrap; align-items:stretch;
    border:solid 2px lightgray; border-radius:4px;
    padding:10px;
  }

  .LoginDialog > div > [name="CloseButton"] {
    display:block; position:absolute;
    top:-20px; right:-20px; width:20px; height:20px;
    border:solid 2px white; border-radius:50%;
    box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2), 0px 0px 0px 1px lightgray;
    background-color:black;
    padding:0px 0px 0px 1px;
    font-size:18px; font-weight:bold; line-height:12px;
    text-align:center;
    color:white;
  }

  .LoginDialog > div > [name="Title"] {
    display:block; position:relative;
    padding:4px 0px 14px 0px;
    font-size:18px; font-weight:bold;
    text-align:center;
    color:#222222;
  }

  .LoginDialog > div > [name="EMailAddressInput"],
  .LoginDialog > div > [name="PasswordInput"] {
    appearance:none; -webkit-appearance:none; -moz-appearance:none; -o-appearance:none;
    display:block; position:relative;
    margin:4px 0px 4px 0px; padding:4px;
    border:solid 1px lightgray; border-radius:2px;
    font-size:16px;
  }

  .LoginDialog > div > [name="EMailAddressInput"]:invalid + div.FormMessage::before {
    display:inline-block; color:red;
    content:"please enter a valid email address"
  }

  .LoginDialog > div > [name="EMailAddressInput"]:valid + div.FormMessage::before {
    display:inline-block;
    content:"your email address looks acceptable"
  }

  .LoginDialog > div > [name="PasswordInput"]:invalid + div.FormMessage::before {
    display:inline-block; color:red;
    content:"a password must contain 10 characters, at least"
  }

  .LoginDialog > div > [name="PasswordInput"]:valid + div.FormMessage::before {
    display:inline-block;
    content:"your password looks acceptable"
  }

  .LoginDialog > div > [name="ForgottenPassword"] {
    display:block; position:relative;
    padding:10px 0px 10px 0px;
    text-align:right;
  }

  .LoginDialog > div > [name="LoginButton"] {
    appearance:none; -webkit-appearance:none; -moz-appearance:none; -o-appearance:none;
    display:block; position:relative;
    margin:4px 0px 4px 0px; padding:6px;
    background-color:#2980B9;
    border:none; border-radius:4px;
    font-size:16px; font-weight:bold; color:white;
  }

  div.FormMessage { display:block; position:relative; left:2px; top:-2px; font-size:12px }

</style>

<div class="LoginDialog">
  <div>
    <div name="CloseButton">&times;</div>
    <div name="Title">Please Login</div>
    <input name="EMailAddressInput" type="email" required placeholder="your email address">
    <div class="FormMessage">&nbsp;</div>
    <input name="PasswordInput" type="password" required minlength="10" placeholder="your password">
    <div class="FormMessage">&nbsp;</div>
    <div name="ForgottenPassword"><a href="">Forgot your password?</a></div>
    <button name="LoginButton">Login</button>
    <div style="text-align:center">
      Don't have an account? <a href="">Create one!</a>
    </div>
  </div>
</div>
