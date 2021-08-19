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

  .Dialog > div {
    display:flex; position:relative;
    flex-flow:column nowrap; align-items:stretch;
    border:solid 2px lightgray; border-radius:4px;
    padding:10px;
  }

  .Dialog > div > [name="Title"] {
    display:block; position:relative;
    padding:4px 0px 14px 0px;
    font-size:18px; font-weight:bold;
    text-align:center;
    color:#222222;
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

  .Dialog > div .Hint {
    display:inline-block; position:relative;
    left:2px; top:-2px;
    font-size:12px
  }

  .Dialog > div .invalid.Hint {
    color:red;
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


</style>

<script context="module" lang="ts">
  import { Globals } from './Globals.js'

  import {
    focusOnApplication, actOnBehalfOfCustomer, resetCustomerPasswordUsing
  } from 'voltcloud-for-browsers'
</script>

<script lang="ts">
  let Password:string,     PasswordLooksBad:boolean,     PasswordMessage:string
  let Confirmation:string, ConfirmationLooksBad:boolean, ConfirmationMessage:string

  Password = Confirmation = ''

  $: switch (true) {
    case (Password === ''):
      PasswordLooksBad = true;  PasswordMessage = 'please, enter your password'
      break
    case (Password.length < 10):
      PasswordLooksBad = true;  PasswordMessage = 'your password is too short'
      break
    case ! /[0-9]/.test(Password):
      PasswordLooksBad = true;  PasswordMessage = 'your password lacks any digits'
      break
    case (Password.toLowerCase() === Password):
      PasswordLooksBad = true;  PasswordMessage = 'your password lacks any uppercase characters'
      break
    case (Password.toUpperCase() === Password):
      PasswordLooksBad = true;  PasswordMessage = 'your password lacks any lowercase characters'
      break
    default:
      PasswordLooksBad = false; PasswordMessage = 'your password looks acceptable'
  }

  $: switch (true) {
    case (Confirmation === ''):
      ConfirmationLooksBad = true;  ConfirmationMessage = 'please, enter your new password again'
      break
    case (Confirmation !== Password):
      ConfirmationLooksBad = true;  ConfirmationMessage = 'password differs from confirmation'
      break
    default:
      ConfirmationLooksBad = false; ConfirmationMessage = 'password and confirmation are equal'
  }

  $: ResetIsForbidden = PasswordLooksBad || ConfirmationLooksBad

  function closeDialog (Event) {
    Event.preventDefault()
    Globals.define('State','')
  }

  async function resetPassword (Event) {
    Event.preventDefault()

    Globals.define('State','resettingPassword')

    try {
      await focusOnApplication($Globals.ApplicationURL,$Globals.ApplicationId)
      await resetCustomerPasswordUsing($Globals.ResetToken, Password)
    } catch (Signal) {
      Globals.define({ State:'CommunicationFailure', FailureReason:Signal.toString() })
      return
    }

    Globals.define({ ResetToken:'', Password, State:'PasswordReset' })
  }
</script>

<div class="Dialog">
  <div>
    <div name="Title">Password Reset</div>
    <div name="CloseButton" on:click={closeDialog}>&times;</div>

    <div class="Block">
      You may now define a new password.
    </div>

    <div class="Block">
      Warning: if you set a different password than before, you will loose
      all your existing data!
    </div>

    <input type="password" bind:value={Password} placeholder="your new password">
    <div class:Hint={true} class:invalid={PasswordLooksBad}>{PasswordMessage}</div>

    <input type="password" bind:value={Confirmation} placeholder="confirm your new password">
    <div class:Hint={true} class:invalid={ConfirmationLooksBad}>{ConfirmationMessage}</div>

    <button disabled={ResetIsForbidden} on:click={resetPassword}>Reset Password</button>
  </div>
</div>
