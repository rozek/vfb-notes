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
  import { Globals } from './Globals.js'

  import {
    maxNamePartLength,
    focusOnApplication, actOnBehalfOfCustomer, updateCustomerRecordBy
  } from 'voltcloud-for-browsers'
</script>

<script lang="ts">
  let firstName:string, firstNameLooksBad:boolean, firstNameMessage:string
  let lastName:string,  lastNameLooksBad:boolean,  lastNameMessage:string

  firstName = $Globals.firstName
  lastName  = $Globals.lastName

  $: switch (true) {
    case (firstName.trim() === ''):
      firstNameLooksBad = false; firstNameMessage = 'please, enter your first name'
      break
    case (firstName.trim().length > maxNamePartLength):
      firstNameLooksBad = true;  firstNameMessage = 'the given name is too long'
      break
    default:
      firstNameLooksBad = false; firstNameMessage = 'the given name looks acceptable'
  }

  $: switch (true) {
    case (lastName.trim() === ''):
      lastNameLooksBad = false; lastNameMessage = 'please, enter your last name'
      break
    case (lastName.trim().length > maxNamePartLength):
      lastNameLooksBad = true;  lastNameMessage = 'the given name is too long'
      break
    default:
      lastNameLooksBad = false; lastNameMessage = 'the given name looks acceptable'
  }

  $: ChangeIsForbidden = firstNameLooksBad || lastNameLooksBad

  function closeDialog (Event) {
    Event.preventDefault()
    Globals.define('State','')
  }

  async function changeName (Event) {
    Event.preventDefault()

    Globals.define({ State:'changingName' })

    try {
      await focusOnApplication($Globals.ApplicationURL,$Globals.ApplicationId)
      await actOnBehalfOfCustomer($Globals.EMailAddress,$Globals.Password)
      await updateCustomerRecordBy({ first_name:firstName, last_name:lastName })
    } catch (Signal) {
      switch (Signal.name) {
        case 'LoginFailed':
        case 'BadToken':
          return Globals.define({ loggedIn:false, State:'loggedOut' })
        default:
          return Globals.define({
            State:'CommunicationFailure', FailureReason:Signal.toString()
          })
      }
    }

    Globals.define({
      firstName:firstName.trim(), lastName:lastName.trim(),
      State:'NameChanged'
    })
  }
</script>

<div class="Dialog">
  <div>
    <div name="Title">Name Change</div>
    <div name="CloseButton" on:click={closeDialog}>&times;</div>

    <input type="text" bind:value={firstName} placeholder="your first name">
    <div class:Hint={true} class:invalid={firstNameLooksBad}>{firstNameMessage}</div>

    <input type="text" bind:value={lastName} placeholder="your last name">
    <div class:Hint={true} class:invalid={lastNameLooksBad}>{lastNameMessage}</div>

    <button disabled={ChangeIsForbidden} on:click={changeName}>Change Name</button>
  </div>
</div>
