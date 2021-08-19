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
    display:block; position:relative; flex:1 1 auto; overflow:auto;
  }

  .TabStrip {
    display:inline-flex; position:relative; overflow:hidden;
    width:100%; height:52px;
    border:none; border-top:solid 1px black;
    padding:4px;
    font-size:16px; line-height:22px; color:#0080FF;
  }

  .Tab {
    display:inline-block; position:relative;
    height:100%; width:25%;
    text-align:center;
    cursor:pointer;
  }


  .NavigationBar .Button[disabled="true"] { opacity:0.3 }
  .ContentArea > .Placeholder {
    display:flex; flex-flow:column nowrap; justify-content:center;
    position:absolute; left:0px; top:0px; right:0px; bottom:0px;
    font-size:32px; font-weight:bold; color:rgba(0,0,0,0.1);
    text-align:center; pointer-events:none;
  }

  .ContentArea > .Placeholder > span {
    position:relative; top:-20px; pointer-events:none;
  }

  .ContentArea > textarea {
    width:100%; height:auto; min-height:99%; resize:none;
    background:transparent;
    border:none; outline:none;
    padding:4px;
    font-family:inherit; font-size:inherit; font-weight:normal;
  }

</style>

<script context="module" lang="ts">
  import { onMount } from 'svelte'

  import {
    focusOnApplication, actOnBehalfOfCustomer,
    CustomerStorageEntry, setCustomerStorageEntryTo
  } from 'voltcloud-for-browsers'

  import { randomBytes, secretbox } from 'tweetnacl'
  import { encode, decode }         from '@stablelib/base64'

  import { Globals } from './Globals.js'
</script>

<script lang="ts">
  function logout ()             { performAutoSave(); Globals.define({ loggedIn:false, State:'loggedOut' }) }
  function changeEMailAddress () { performAutoSave(); Globals.define('State','EMailAddressChange') }
  function changePassword ()     { performAutoSave(); Globals.define('State','PasswordChange') }
  function changeName ()         { performAutoSave(); Globals.define('State','NameChange') }
  function deleteAccount ()      { performAutoSave(); Globals.define('State','Unregistration') }

  let DelayTimer:any, DelayLimitTimer:any

  function triggerAutoSave () {
    if (DelayTimer != null) { clearTimeout(DelayTimer) }
    DelayTimer = setTimeout(performAutoSave, 1000)

    if (DelayLimitTimer == null) {
      DelayLimitTimer = setTimeout(() => {
        if (isSaving) {
          changedWhileSaving = true
        } else {
          performAutoSave()
        }
      }, 10000)
    }
  }


  let isSaving:boolean           = false
  let changedWhileSaving:boolean = false

  async function performAutoSave () {
    if (DelayTimer == null) { return }
    if (isSaving)           { return }

    clearTimeout(DelayTimer);      DelayTimer      = undefined
    clearTimeout(DelayLimitTimer); DelayLimitTimer = undefined

    if (isRefreshing) { return }

    isSaving = true; changedWhileSaving = false
      try {
        await focusOnApplication($Globals.ApplicationURL,$Globals.ApplicationId)
        await actOnBehalfOfCustomer($Globals.EMailAddress,$Globals.Password)
        await setCustomerStorageEntryTo('NoteText',encrypted(NoteText))
      } catch (Signal) {
        isSaving = false

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
    isSaving = false

    if (changedWhileSaving) { performAutoSave() } // for extremely slow networks
  }


  let isRefreshing:boolean  = false
  let justRefreshed:boolean = false

  async function performRefresh () {
    if (isRefreshing) { return }

    isRefreshing = true
      if (DelayTimer      != null) { clearTimeout(DelayTimer);      DelayTimer      = undefined }
      if (DelayLimitTimer != null) { clearTimeout(DelayLimitTimer); DelayLimitTimer = undefined }

      try {
        await focusOnApplication($Globals.ApplicationURL,$Globals.ApplicationId)
        await actOnBehalfOfCustomer($Globals.EMailAddress,$Globals.Password)

        let decryptedText = decrypted((await CustomerStorageEntry('NoteText')) || '')
          if (decryptedText == null) {
            isRefreshing = false
            return Globals.define('State','DecryptionFailure')
          }
        NoteText = decryptedText

        justRefreshed = true
      } catch (Signal) {
        isRefreshing = false

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
    isRefreshing = false
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
    if (Base64Value === '') { return '' }

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



  let NoteText:string = localStorage['vfb-notes: note-text'] || ''
  justRefreshed = true                        // trick to avoid initial autosave
  performRefresh()

  $: {
    localStorage['vfb-notes: note-text'] = NoteText
    if (justRefreshed) { justRefreshed = false } else { triggerAutoSave() }
  }

  let Editor:HTMLElement // bug fix for some browsers which ignore "height:auto"
  onMount(() => {
    Editor.style.overflowY = 'hidden'

    function setEditorHeight () {
      let Height = Math.max(
        (Editor.parentElement as HTMLElement).clientHeight-6, Editor.scrollHeight
      )
      Editor.style.height = Height + 'px'
    }
    setEditorHeight()

    Editor.addEventListener('input',setEditorHeight)
  })
</script>

<div class="Page">
  <div class="NavigationBar">
    <div class="left Button" on:click|preventDefault={logout}><span class="Caret">⟨</span> Logout</div>
    <div class="Title">VfB-Notes</div>
    <div class="right Button" disabled={isSaving || isRefreshing}
      on:click|preventDefault={performRefresh}>Refresh</div>
  </div>
  <div class="ContentArea" style="background-color:ivory">
    {#if NoteText === ''}
      <div class="Placeholder"><span>Enter your text here</span></div>
    {/if}
    <textarea bind:this={Editor} bind:value={NoteText}></textarea>
  </div>
  <div class="TabStrip">
    <div class="Tab" on:click|preventDefault={changeEMailAddress}>Change<br>EMail</div>
    <div class="Tab" on:click|preventDefault={changePassword}    >Change<br>Password</div>
    <div class="Tab" on:click|preventDefault={changeName}        >Change<br>Name</div>
    <div class="Tab" on:click|preventDefault={deleteAccount}     >Delete<br>Account</div>
  </div>

  <slot></slot>
</div>