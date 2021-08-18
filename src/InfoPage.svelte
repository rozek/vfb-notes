<style>
  .Page {
    display:flex; flex-flow:column nowrap; align-items:stretch;
    display:relative; width:100%; height:100%;
  }

  .NavigationBar {
    display:flex; flex:0 0 auto;
    width:100%; height:44px;
    border:none; border-bottom:solid 1px black;
    font-size:18px; font-weight:bold;
  }

  .NavigationBar .Button {
    display:inline-block; position:absolute;
    top:0px; width:auto; height:44px;
    line-height:44px; color:#0080FF;
    cursor:pointer;
  }

  .NavigationBar .left.Button  { left:10px;  text-align:left }
  .NavigationBar .right.Button { right:10px; text-align:right }

  .NavigationBar .Caret {
    display:inline; position:relative;
    top:0px; font-size:22px; font-weight:bold;
  }

  .NavigationBar .Title {
    display:block; position:absolute;
    width:100%; height:44px;
    text-align:center; line-height:44px;
    pointer-events:none;
  }

  .ContentArea {
    display:block; flex:1 1 auto; overflow:auto;
  }



  .ContentArea .Block {
    display:block; margin:20px;
    text-align:justify;
  }
</style>

<script context="module" lang="ts">
  import { Globals } from './Globals.js'
</script>

<script lang="ts">
  function showLegal ()  { document.location.href = '#/Legal' }
  function startLogin () { Globals.define('State','Login') }
</script>

<div class="Page">
  <div class="NavigationBar">
    <div class="left Button"  on:click|preventDefault={showLegal}>Legal Info</div>
    <div class="Title">VfB-Notes</div>
    <div class="right Button" on:click|preventDefault={startLogin}>Proceed <span class="Caret">⟩</span></div>
  </div>
  <div class="ContentArea">
    <div class="Block">
      "VfB-Notes" is a trivial demonstrator for the
      <a href="https://github.com/rozek/voltcloud-for-browsers">voltcloud-for-browsers</a>
      library.
    </div>
    <div class="Block">
      <a href="https://voltcloud.io/">VoltCloud.io</a> is a simple (and
      reasonably priced) deployment server for web applications with integrated
      user management and key-value stores for both the application itself and
      any of its users.
    </div>
    <div class="Block">
      <a href="https://github.com/rozek/voltcloud-for-browsers">voltcloud-for-browsers</a>
      is a simple client library for web applications which need access to
      VoltCloud and its functions.
    </div>
    <div class="Block">
      This demonstrator implements all user management processes VoltCloud
      offers - ranging from user registration, email confirmation, password
      reset up to user login, account management and, last not least, account
      deletion.
    </div>
    <div class="Block">
      The service this application provides is, on the other hand, rather
      trivial: registered users will be able to edit a single page of online
      text notes from their smartphones (or tablets, desktops or notebooks)
    </div>
    <div class="Block">
      This "service" is provided free of charge on a "best-effort" basis.
    </div>
    <div class="Block">
      Please, consider the <a href="#/" on:click|preventDefault={showLegal}>Data Privacy
      Statement</a> for this little application and VoltCloud's
      <a href="https://www.appstudio.dev/app/legal/legal.php">Terms of Service</a>
      before applying for an account.
    </div>
  </div>

  <slot></slot>
</div>