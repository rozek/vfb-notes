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
  import { ValueIsEMailAddress } from 'javascript-interface-library'

  import {
    focusOnApplication, actOnBehalfOfCustomer, changeCustomerEMailAddressTo
  } from 'voltcloud-for-browsers'

  import { Globals } from './Globals.js'
</script>

<script lang="ts">
  let EMailAddress:string, AddressLooksBad:boolean, AddressMessage:string

  EMailAddress = $Globals.EMailAddress || ''

  $: switch (true) {
    case (EMailAddress.trim() === ''):
      AddressLooksBad = true;  AddressMessage = 'please, enter your new email address'
      break
    case ValueIsEMailAddress(EMailAddress):
      AddressLooksBad = false; AddressMessage = 'your new email address looks acceptable'
      break
    default:
      AddressLooksBad = true;  AddressMessage = 'please, enter a valid email address'
  }

  $: ChangeIsForbidden = AddressLooksBad

  function closeDialog () {
    Globals.define('State','')
  }

  async function changeEMailAddress () {
    Globals.define('State','changingEMailAddress')

    try {
      await focusOnApplication($Globals.ApplicationURL,$Globals.ApplicationId)
      await actOnBehalfOfCustomer($Globals.EMailAddress,$Globals.Password)
      await changeCustomerEMailAddressTo(EMailAddress)
    } catch (Signal) {
      switch (Signal.name) {
        case 'LoginFailed':
        case 'BadToken':
          return Globals.define({ loggedIn:false, State:'loggedOut' })
        case 'ConflictError':
          return Globals.define('State','EMailAddressChangeFailure')
        default:
          return Globals.define({
            State:'CommunicationFailure', FailureReason:Signal.toString()
          })
      }
    }

    Globals.define({ EMailAddress, State:'EMailAddressChanged' })
  }
</script>

<div class="Dialog">
  <div>
    <div name="Title">EMail Address Change</div>
    <div name="CloseButton" on:click|preventDefault={closeDialog}>&times;</div>

    <input type="email" bind:value={EMailAddress} placeholder="your new email address">
    <div class:Hint={true} class:invalid={AddressLooksBad}>{AddressMessage}</div>

    <button disabled={ChangeIsForbidden} on:click|preventDefault={changeEMailAddress}>Change EMail Address</button>
  </div>
</div>
