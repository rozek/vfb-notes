<style>
  .Dialog {
    display:inline-block; flex:0 0 auto; position:relative;
    width:300px; height:auto;
    margin:0px; margin-top:-20px;
    border:none; border-radius:8px;
    padding:10px;
    box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);
    background-color:white;
  }

  .Dialog a, .Dialog a:visited {
    color:#2980B9;
    text-decoration:underline;
  }

  .Dialog > div {
    display:flex; position:relative;
    flex-flow:column nowrap; align-items:stretch;
    border:solid 2px lightgray; border-radius:4px;
    padding:10px;
  }

  .Dialog > div > [name="CloseButton"] {
    display:block; position:absolute;
    top:-20px; right:-20px; width:20px; height:20px;
    border:solid 2px white; border-radius:50%;
    box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2), 0px 0px 0px 1px lightgray;
    background-color:black;
    padding:0px;
    font-size:18px; font-weight:bold; line-height:12px;
    text-align:center;
    color:white;
    cursor:pointer;
  }

  .Dialog > div > [name="Title"] {
    display:block; position:relative;
    padding:4px 0px 14px 0px;
    font-size:18px; font-weight:bold;
    text-align:center;
    color:#222222;
  }

  .Dialog > div > .Block {
    display:block; margin:0px 0px 10px 0px;
    text-align:justify;
  }

  .Dialog > div > input {
    appearance:none; -webkit-appearance:none; -moz-appearance:none; -o-appearance:none;
    display:block; position:relative;
    margin:4px 0px 4px 0px; padding:4px;
    border:solid 1px lightgray; border-radius:2px;
    font-size:16px;
  }

  .Dialog > div > button {
    appearance:none; -webkit-appearance:none; -moz-appearance:none; -o-appearance:none;
    display:block; position:relative;
    margin:4px 0px 4px 0px; padding:6px;
    background-color:#2980B9;
    border:none; border-radius:4px;
    font-size:16px; font-weight:bold; color:white;
    cursor:pointer;
  }

  .Dialog > div > button:disabled {
    opacity:0.3;
    cursor:auto;
  }

  .Dialog > div > .FormMessage {
    display:inline-block; position:relative;
    left:2px; top:-2px;
    font-size:12px
  }

  .Dialog > div > .invalid.FormMessage {
    color:red;
  }


</style>

<script context="module" lang="ts">
  import { Globals } from './Globals.js'
</script>

<script lang="ts">
  function showRegistration (Event) {
    Event.preventDefault()
    Globals.define('State','Registration')
  }

  function showPasswordReset (Event) {
    Event.preventDefault()
    Globals.define('State','PasswordReset')
  }

  function closeMessage (Event) {
    Event.preventDefault()
    Globals.define('State','')
  }
</script>

<div class="Dialog">
  <div>
    <div name="Title">Login Failure</div>

    <div class="Block">
      Your EMail address or your password may have been incorrect.
    </div>

    <div class="Block">
      If you have not yet applied for an account, just
      <a href="#/" on:click={showRegistration}>create one</a>!
    </div>

    <div class="Block">
      If you forgot your password, you may ask for a
      <a href="#/" on:click={showPasswordReset}>password reset</a>
    </div>

    <button on:click={closeMessage}>Ok</button>
  </div>
</div>
