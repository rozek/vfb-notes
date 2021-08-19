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
    focusOnApplication, actOnBehalfOfCustomer, changeCustomerPasswordTo,
    CustomerStorageEntry, setCustomerStorageEntryTo
  } from 'voltcloud-for-browsers'

  import { randomBytes, secretbox } from 'tweetnacl'
  import { encode, decode }         from '@stablelib/base64'
</script>

<script lang="ts">
  let oldPassword:string, oldPasswordLooksBad:boolean, oldPasswordMessage:string
  let newPassword:string, newPasswordLooksBad:boolean, newPasswordMessage:string
  let newConfirmation:string, newConfirmationLooksBad:boolean, newConfirmationMessage:string

  oldPassword = newPassword = newConfirmation = ''

  $: switch (true) {
    case (oldPassword === ''):
      oldPasswordLooksBad = true;  oldPasswordMessage = 'please, enter your current password'
      break
    case (oldPassword.length < 10):
      oldPasswordLooksBad = true;  oldPasswordMessage = 'your pcurrent assword is too short'
      break
    case ! /[0-9]/.test(oldPassword):
      oldPasswordLooksBad = true;  oldPasswordMessage = 'your current password lacks any digits'
      break
    case (oldPassword.toLowerCase() === oldPassword):
      oldPasswordLooksBad = true;  oldPasswordMessage = 'your current password lacks any uppercase characters'
      break
    case (oldPassword.toUpperCase() === oldPassword):
      oldPasswordLooksBad = true;  oldPasswordMessage = 'your current password lacks any lowercase characters'
      break
    default:
      oldPasswordLooksBad = false; oldPasswordMessage = 'your current password looks acceptable'
  }

  $: switch (true) {
    case (newPassword === ''):
      newPasswordLooksBad = true;  newPasswordMessage = 'please, enter your new password'
      break
    case (newPassword.length < 10):
      newPasswordLooksBad = true;  newPasswordMessage = 'your new password is too short'
      break
    case ! /[0-9]/.test(newPassword):
      newPasswordLooksBad = true;  newPasswordMessage = 'your new password lacks any digits'
      break
    case (newPassword.toLowerCase() === newPassword):
      newPasswordLooksBad = true;  newPasswordMessage = 'your new password lacks any uppercase characters'
      break
    case (newPassword.toUpperCase() === newPassword):
      newPasswordLooksBad = true;  newPasswordMessage = 'your new password lacks any lowercase characters'
      break
    default:
      newPasswordLooksBad = false; newPasswordMessage = 'your new password looks acceptable'
  }

  $: switch (true) {
    case (newConfirmation === ''):
      newConfirmationLooksBad = true;  newConfirmationMessage = 'please, enter your new password again'
      break
    case (newConfirmation !== newPassword):
      newConfirmationLooksBad = true;  newConfirmationMessage = 'new password differs from confirmation'
      break
    default:
      newConfirmationLooksBad = false; newConfirmationMessage = 'new password and confirmation are equal'
  }

  $: ChangeIsForbidden = oldPasswordLooksBad || newPasswordLooksBad || newConfirmationLooksBad

  function closeDialog () {
    Globals.define('State','')
  }

  async function changePassword () {
    if ($Globals.Password === oldPassword) {
      Globals.define('State','changingPassword')

      try {
        await focusOnApplication($Globals.ApplicationURL,$Globals.ApplicationId)
        await actOnBehalfOfCustomer($Globals.EMailAddress,$Globals.Password)
        await changeCustomerPasswordTo(newPassword)
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

      try {
        let NoteText = decrypted((await CustomerStorageEntry('NoteText')) || '')
          Globals.define('Password',newPassword)

          if (NoteText == null) {                          // decryption failure
            return Globals.define({
              State:'ReencryptionFailure',
              FailureReason:'DecryptionFailed: could not decrypt existing note'
            })
          }
        await setCustomerStorageEntryTo('NoteText',encrypted(NoteText))
      } catch (Signal) {
        Globals.define('Password',newPassword)
        return Globals.define({
          State:'ReencryptionFailure', FailureReason:Signal.toString()
        })
      }

      Globals.define('State','PasswordChanged')
    } else {
      Globals.define('State','wrongPassword')
    }
  }

  function encrypted (Text:string):string {
// @ts-ignore $Globals.EncryptionKey *is* a Uint8Array
    let EncryptionKey  = $Globals.EncryptionKey as Uint8Array     // after login
    let Nonce          = randomBytes(secretbox.nonceLength)
    let encryptedValue = secretbox((new TextEncoder()).encode(Text), Nonce, EncryptionKey)

    let Result = new Uint8Array(Nonce.length + encryptedValue.length)
      Result.set(Nonce)
      Result.set(encryptedValue,Nonce.length)
    return encode(Result)                                  // now Base64-encoded
  }

  function decrypted (Base64Value:string):string | undefined {
// @ts-ignore $Globals.EncryptionKey *is* a Uint8Array
    let EncryptionKey = $Globals.EncryptionKey as Uint8Array      // after login

    let Buffer
      try {
        Buffer = decode(Base64Value)
      } catch (Signal) {
        console.error('Base64 decode failed',Signal)
        return undefined
      }

      if (Buffer.length < secretbox.nonceLength) {
        return undefined
      }
    let Nonce  = Buffer.slice(0,secretbox.nonceLength)
    let decryptedValue = secretbox.open(
      Buffer.slice(secretbox.nonceLength), Nonce, EncryptionKey
    )
    return (
      decryptedValue == null
      ? undefined
      : (new TextDecoder()).decode(decryptedValue)
    )
  }


</script>

<div class="Dialog">
  <div>
    <div name="Title">Password Change</div>
    <div name="CloseButton" on:click|preventDefault={closeDialog}>&times;</div>

    <div class="Block">
      You may now change your password. If successful, your notes will
      automatically be re-encrypted using the new password.
    </div>

    <div class="Block">
      Important: please close all other currently running instances of this
      application (on every device and browser) or those instances could
      damage your data!
    </div>

    <input type="password" bind:value={oldPassword} placeholder="your current password">
    <div class:Hint={true} class:invalid={oldPasswordLooksBad}>{oldPasswordMessage}</div>

    <input type="password" bind:value={newPassword} placeholder="your new password">
    <div class:Hint={true} class:invalid={newPasswordLooksBad}>{newPasswordMessage}</div>

    <input type="password" bind:value={newConfirmation} placeholder="confirm your new password">
    <div class:Hint={true} class:invalid={newConfirmationLooksBad}>{newConfirmationMessage}</div>

    <button disabled={ChangeIsForbidden} on:click|preventDefault={changePassword}>Change Password</button>
  </div>
</div>
