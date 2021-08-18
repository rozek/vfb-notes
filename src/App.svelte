<style>
  :global(*) {
    -moz-box-sizing:border-box; -webkit-box-sizing:border-box; box-sizing:border-box;
  }
</style>

<script context="module" lang="ts">
  import {
    focusOnApplication, confirmCustomerUsing
  } from 'voltcloud-for-browsers'

  import ApplicationCell             from './ApplicationCell.svelte'
  import InfoPage                    from './InfoPage.svelte'
  import LegalPage                   from './LegalPage.svelte'
  import NotePage                    from './NotePage.svelte'
  import Overlay                     from './Overlay.svelte'
  import RegistrationDialog          from './RegistrationDialog.svelte'
  import RegistrationNotice          from './RegistrationNotice.svelte'
  import RegistrationSuccessNotice   from './RegistrationSuccessNotice.svelte'
  import RegistrationFailureNotice   from './RegistrationFailureNotice.svelte'
  import RenewalDialog               from './RenewalDialog.svelte'
  import RenewalNotice               from './RenewalNotice.svelte'
  import RenewedNotice               from './RenewedNotice.svelte'
  import ConfirmationNotice          from './ConfirmationNotice.svelte'
  import ConfirmedNotice             from './ConfirmedNotice.svelte'
  import ResetRequestDialog          from './ResetRequestDialog.svelte'
  import ResetRequestNotice          from './ResetRequestNotice.svelte'
  import ResetRequestedNotice        from './ResetRequestedNotice.svelte'
  import PasswordResetDialog         from './PasswordResetDialog.svelte'
  import PasswordResetNotice         from './PasswordResetNotice.svelte'
  import PasswordResetSuccessNotice  from './PasswordResetSuccessNotice.svelte'
  import LoginDialog                 from './LoginDialog.svelte'
  import LoginNotice                 from './LoginNotice.svelte'
  import LoginFailureNotice          from './LoginFailureNotice.svelte'
  import EMailChangeDialog           from './EMailChangeDialog.svelte'
  import EMailChangeNotice           from './EMailChangeNotice.svelte'
  import EMailChangedNotice          from './EMailChangedNotice.svelte'
  import EMailChangeFailureNotice    from './EMailChangeFailureNotice.svelte'
  import PasswordChangeDialog        from './PasswordChangeDialog.svelte'
  import PasswordChangeNotice        from './PasswordChangeNotice.svelte'
  import PasswordChangedNotice       from './PasswordChangedNotice.svelte'
  import PasswordChangeFailureNotice from './PasswordChangeFailureNotice.svelte'
  import NameChangeDialog            from './NameChangeDialog.svelte'
  import NameChangeNotice            from './NameChangeNotice.svelte'
  import NameChangedNotice           from './NameChangedNotice.svelte'
  import LogoutNotice                from './LogoutNotice.svelte'
  import UnregistrationDialog        from './UnregistrationDialog.svelte'
  import UnregistrationNotice        from './UnregistrationNotice.svelte'
  import UnregisteredNotice          from './UnregisteredNotice.svelte'
  import CommunicationFailureNotice  from './CommunicationFailureNotice.svelte'

  import { Globals } from './Globals.js'
</script>

<script lang="ts">
  let completeURL = document.location.href
  switch (true) {
    case (completeURL.indexOf('/#/confirm/') > 0):
      Globals.define({
        ConfirmationToken:completeURL.replace(/^.*\/\#\/confirm\//,''),
        State:'confirming'
      })
      confirmAccount()
      break
    case (completeURL.indexOf('/#/reset/') > 0):
      Globals.define({
        ResetToken:completeURL.replace(/^.*\/\#\/reset\//,''),
        State:'PasswordReset'
      })
  }

  async function confirmAccount () {
    try {
      await focusOnApplication($Globals.ApplicationURL,$Globals.ApplicationId)
      await confirmCustomerUsing($Globals.ConfirmationToken)
    } catch (Signal) {
      Globals.define({ State:'CommunicationFailure', FailureReason:Signal.toString() })
      return
    }

    Globals.define({ ConfirmationToken:'', State:'confirmed' })
  }

  let SubPath = document.location.hash
  window.addEventListener(
    'hashchange', () => { SubPath = document.location.hash }
  )
</script>

<ApplicationCell>
  {#if $Globals.loggedIn}
    <NotePage>
      {#if $Globals.State === 'EMailAddressChange'}        <Overlay><EMailChangeDialog/></Overlay>{/if}
      {#if $Globals.State === 'changingEMailAddress'}      <Overlay><EMailChangeNotice/></Overlay>{/if}
      {#if $Globals.State === 'EMailAddressChanged'}       <Overlay><EMailChangedNotice/></Overlay>{/if}
      {#if $Globals.State === 'EMailAddressChangeFailure'} <Overlay><EMailChangeFailureNotice/></Overlay>{/if}
      {#if $Globals.State === 'PasswordChange'}            <Overlay><PasswordChangeDialog/></Overlay>{/if}
      {#if $Globals.State === 'changingPassword'}          <Overlay><PasswordChangeNotice/></Overlay>{/if}
      {#if $Globals.State === 'PasswordChanged'}           <Overlay><PasswordChangedNotice/></Overlay>{/if}
      {#if $Globals.State === 'wrongPassword'}             <Overlay><PasswordChangeFailureNotice/></Overlay>{/if}
      {#if $Globals.State === 'NameChange'}                <Overlay><NameChangeDialog/></Overlay>{/if}
      {#if $Globals.State === 'changingName'}              <Overlay><NameChangeNotice/></Overlay>{/if}
      {#if $Globals.State === 'NameChanged'}               <Overlay><NameChangedNotice/></Overlay>{/if}
      {#if $Globals.State === 'loggedOut'}                 <Overlay><LogoutNotice/></Overlay>{/if}
      {#if $Globals.State === 'Unregistration'}            <Overlay><UnregistrationDialog/></Overlay>{/if}
      {#if $Globals.State === 'unregistering'}             <Overlay><UnregistrationNotice/></Overlay>{/if}
      {#if $Globals.State === 'unregistered'}              <Overlay><UnregisteredNotice/></Overlay>{/if}
      {#if $Globals.State === 'CommunicationFailure'}      <Overlay><CommunicationFailureNotice/></Overlay>{/if}
    </NotePage>
  {:else}
    {#if SubPath === '#/Legal'}
      <LegalPage/>
    {:else}
      <InfoPage>
        {#if $Globals.State === 'Registration'}        <Overlay><RegistrationDialog/></Overlay>{/if}
        {#if $Globals.State === 'registering'}         <Overlay><RegistrationNotice/></Overlay>{/if}
        {#if $Globals.State === 'registered'}          <Overlay><RegistrationSuccessNotice/></Overlay>{/if}
        {#if $Globals.State === 'RegistrationFailed'}  <Overlay><RegistrationFailureNotice/></Overlay>{/if}
        {#if $Globals.State === 'RenewalRequest'}      <Overlay><RenewalDialog/></Overlay>{/if}
        {#if $Globals.State === 'renewing'}            <Overlay><RenewalNotice/></Overlay>{/if}
        {#if $Globals.State === 'renewed'}             <Overlay><RenewedNotice/></Overlay>{/if}
        {#if $Globals.State === 'confirming'}          <Overlay><ConfirmationNotice/></Overlay>{/if}
        {#if $Globals.State === 'confirmed'}           <Overlay><ConfirmedNotice/></Overlay>{/if}
        {#if $Globals.State === 'ResetRequest'}        <Overlay><ResetRequestDialog/></Overlay>{/if}
        {#if $Globals.State === 'requestingReset'}     <Overlay><ResetRequestNotice/></Overlay>{/if}
        {#if $Globals.State === 'ResetRequested'}      <Overlay><ResetRequestedNotice/></Overlay>{/if}
        {#if $Globals.State === 'ResetPassword'}       <Overlay><PasswordResetDialog/></Overlay>{/if}
        {#if $Globals.State === 'resettingPassword'}   <Overlay><PasswordResetNotice/></Overlay>{/if}
        {#if $Globals.State === 'PasswordReset'}       <Overlay><PasswordResetSuccessNotice/></Overlay>{/if}
        {#if $Globals.State === 'Login'}               <Overlay><LoginDialog/></Overlay>{/if}
        {#if $Globals.State === 'sendingLogin'}        <Overlay><LoginNotice/></Overlay>{/if}
        {#if $Globals.State === 'LoginFailure'}        <Overlay><LoginFailureNotice/></Overlay>{/if}
        {#if $Globals.State === 'CommunicationFailure'}<Overlay><CommunicationFailureNotice/></Overlay>{/if}
      </InfoPage>
    {/if}
  {/if}
</ApplicationCell>
