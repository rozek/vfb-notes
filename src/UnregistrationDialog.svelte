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
    focusOnApplication, actOnBehalfOfCustomer, deleteCustomer
  } from 'voltcloud-for-browsers'
</script>

<script lang="ts">
  let StatementChecked:boolean = false

  function closeDialog (Event) {
    Event.preventDefault()
    Globals.define('State','')
  }

  async function deleteAccount (Event) {
    Event.preventDefault()

    Globals.define({ State:'unregistering' })

    try {
      await focusOnApplication($Globals.ApplicationURL,$Globals.ApplicationId)
      await actOnBehalfOfCustomer($Globals.EMailAddress,$Globals.Password)
      await deleteCustomer()
    } catch (Signal) {
      if (Signal.name === 'LoginFailed') {
        return Globals.define({ loggedIn:false, State:'loggedOut' })
      } else {
        return Globals.define({
          State:'CommunicationFailure', FailureReason:Signal.toString()
        })
      }
    }

    Globals.define({ loggedIn:false, AccessToken:'', State:'unregistered' })
  }
</script>

<div class="Dialog">
  <div>
    <div name="Title">Account Deletion</div>
    <div name="CloseButton" on:click={closeDialog}>&times;</div>

    <div class="Block">
      You are about to delete your account.
    </div>

    <div class="Block">
      This operation will also delete your notes and can not be reverted!
    </div>

    <div class="Block">
      Please check the following statement if you really want to proceed.
    </div>

    <div class="Block">
      <input type="checkbox" bind:checked={StatementChecked}/>
      I accept loosing all my data
    </div>

    <button disabled={! StatementChecked} on:click={deleteAccount}>Delete Account</button>
  </div>
</div>
