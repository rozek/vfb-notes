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



  .TabStrip {
    display:inline-flex; position:relative; overflow:hidden;
    width:100%; height:52px;
    border:none; border-top:solid 1px black;
    padding:4px;
    font-size:18px; line-height:22px;
  }

  .Tab {
    display:inline-block; position:relative;
    height:100%; width:25%;
    text-align:center;
    cursor:pointer;
  }
</style>

<script context="module" lang="ts">
  import { Globals } from './Globals.js'
</script>

<script lang="ts">
  function logout ()             { Globals.define({ loggedIn:false, State:'loggedOut' }) }
  function changeEMailAddress () { Globals.define('State','EMailAddressChange') }
  function changePassword ()     { Globals.define('State','PasswordChange') }
  function changeName ()         { Globals.define('State','NameChange') }
  function deleteAccount ()      { Globals.define('State','Unregistration') }
</script>

<div class="Page">
  <div class="NavigationBar">
    <div class="left Button" on:click|preventDefault={logout}><span class="Caret">⟨</span> Logout</div>
    <div class="Title">VfB-Notes</div>
    <div class="right Button">Refresh</div>
  </div>
  <div class="ContentArea">
  </div>
  <div class="TabStrip">
    <div class="Tab" on:click|preventDefault={changeEMailAddress}>change<br>EMail</div>
    <div class="Tab" on:click|preventDefault={changePassword}    >change<br>Password</div>
    <div class="Tab" on:click|preventDefault={changeName}        >change<br>Name</div>
    <div class="Tab" on:click|preventDefault={deleteAccount}     >delete<br>Account</div>
  </div>

  <slot></slot>
</div>