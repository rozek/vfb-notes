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


  .Dialog a, .Dialog a:visited {
    color:#2980B9;
    text-decoration:underline;
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



  .Dialog > div > [name="LegalRow"] {
    display:block; position:relative;
    padding-top:10px;
    text-align:right;
  }
</style>

<script context="module" lang="ts">
  import { ValueIsEMailAddress } from 'javascript-interface-library'

  import {
    focusOnApplication, focusOnNewCustomer
  } from 'voltcloud-for-browsers'

  import { Globals } from './Globals.js'
</script>

<script lang="ts">
  let EMailAddress:string, AddressLooksBad:boolean,      AddressMessage:string
  let Password:string,     PasswordLooksBad:boolean,     PasswordMessage:string
  let Confirmation:string, ConfirmationLooksBad:boolean, ConfirmationMessage:string
  let DPSAgreementChecked:boolean, DPSAgreementMessage:string
  let TOSAgreementChecked:boolean, TOSAgreementMessage:string

  EMailAddress = $Globals.EMailAddress || ''
  Password     = ''
  DPSAgreementChecked = TOSAgreementChecked = false

  $: switch (true) {
    case (EMailAddress.trim() === ''):
      AddressLooksBad = true;  AddressMessage = 'please, enter your email address'
      break
    case ValueIsEMailAddress(EMailAddress):
      AddressLooksBad = false; AddressMessage = 'your email address looks acceptable'
      break
    default:
      AddressLooksBad = true;  AddressMessage = 'please, enter a valid email address'
  }

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
    case ! /[^a-zA-Z0-9]/.test(Password):
      PasswordLooksBad = true;  PasswordMessage = 'your password lacks any special characters'
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
      ConfirmationLooksBad = true;  ConfirmationMessage = 'please, enter your password again'
      break
    case (Confirmation !== Password):
      ConfirmationLooksBad = true;  ConfirmationMessage = 'password and confirmation differ'
      break
    default:
      ConfirmationLooksBad = false; ConfirmationMessage = 'password and confirmation are equal'
  }

  $: {
    DPSAgreementMessage = (DPSAgreementChecked ? 'thank you' : 'please, agree to apply for an account')
    TOSAgreementMessage = (TOSAgreementChecked ? 'thank you' : 'please, agree to apply for an account')
  }

  $: SubmitIsForbidden = (
    AddressLooksBad || PasswordLooksBad || ConfirmationLooksBad ||
    ! DPSAgreementChecked || ! TOSAgreementChecked
  )

  function closeDialog () { Globals.define('State','') }
  function showLegal ()   { document.location.href = '#/Legal' }
  function startLogin ()  { Globals.define('State','Login') }

  async function createAccount () {
    Globals.define({ State:'registering', EMailAddress, Password })

    try {
      await focusOnApplication($Globals.ApplicationURL,$Globals.ApplicationId)
      await focusOnNewCustomer(EMailAddress,Password)
    } catch (Signal) {
      if (Signal.name === 'ConflictError') {
        Globals.define('State','RegistrationFailed')
      } else {
        Globals.define({ State:'CommunicationFailure', FailureReason:Signal.toString() })
      }
      return
    }

    Globals.define('State','registered')
  }
</script>

<div class="Dialog">
  <div>
    <div name="CloseButton" on:click|preventDefault={closeDialog}>&times;</div>
    <div name="Title">User Registration</div>

    <input type="email" bind:value={EMailAddress} placeholder="your email address">
    <div class:Hint={true} class:invalid={AddressLooksBad}>{AddressMessage}</div>

    <div class="Block">
      Please note: GMX.de and Web.de currently need approx. 2 hours to deliver
      confirmation messages, other providers should be much quicker.
    </div>

    <input type="password" bind:value={Password} placeholder="your password">
    <div class:Hint={true} class:invalid={PasswordLooksBad}>{PasswordMessage}</div>

    <input type="password" bind:value={Confirmation} placeholder="confirm your password">
    <div class:Hint={true} class:invalid={ConfirmationLooksBad}>{ConfirmationMessage}</div>

    <div name="LegalRow">
      <div>
        Agreeing to <a href="#/" on:click|preventDefault={showLegal}>Data Privacy Statement?</a>
        <input type="checkbox" bind:checked={DPSAgreementChecked}>
      </div>
      <div class:Hint={true} class:invalid={! DPSAgreementChecked}>{DPSAgreementMessage}</div>

      <div>
        Agreeing to <a href="https://www.appstudio.dev/app/legal/legal.php">Terms of Service?</a>
        <input type="checkbox" bind:checked={TOSAgreementChecked}>
      </div>
      <div class:Hint={true} class:invalid={! TOSAgreementChecked}>{TOSAgreementMessage}</div>
    </div>

    <button disabled={SubmitIsForbidden} on:click|preventDefault={createAccount}>Create Account</button>

    <div style="text-align:center">
      Already have an account? <a href="#/" on:click|preventDefault={startLogin}>Log in!</a>
    </div>
  </div>
</div>
