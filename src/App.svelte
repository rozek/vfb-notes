<style>
  :global(*) {
    -moz-box-sizing:border-box; -webkit-box-sizing:border-box; box-sizing:border-box;
  }
</style>

<script context="module" lang="ts">
  import { Globals }                 from './Globals.js'
  import ApplicationCell             from './ApplicationCell.svelte'
  import InfoPage                    from './InfoPage.svelte'
  import LegalPage                   from './LegalPage.svelte'
  import NotePage                    from './NotePage.svelte'
  import Overlay                     from './Overlay.svelte'
  import LoginDialog                 from './LoginDialog.svelte'
  import LoggingInDisplay            from './LoggingInDisplay.svelte'
  import LoginFailureDisplay         from './LoginFailureDisplay.svelte'
  import ResetRequestDialog          from './ResetRequestDialog.svelte'
  import ResetRequestSuccessDisplay  from './ResetRequestSuccessDisplay.svelte'
  import CommunicationFailureDisplay from './CommunicationFailureDisplay.svelte'
</script>

<script lang="ts">
  let completeURL = document.location.href
  switch (true) {
    case (completeURL.indexOf('/#/confirm/') > 0):
      Globals.define('ConfirmationToken',completeURL.replace(/^.*\/\#\/confirm\//,'')); break
    case (completeURL.indexOf('/#/reset/') > 0):
      Globals.define('ResetToken',       completeURL.replace(/^.*\/\#\/reset\//,''))
  }

  switch (true) {
    case ($Globals.ConfirmationToken !== ''):
      Globals.define('State','UserConfirmation'); break
    case ($Globals.ConfirmationToken !== ''):
      Globals.define('State','PasswordReset'); break
  }

  let SubPath = document.location.hash
  window.addEventListener(
    'hashchange', () => { SubPath = document.location.hash }
  )

Globals.define('State','ResetRequest')
</script>

<ApplicationCell>
  {#if $Globals.loggedIn}
    <NotePage>
    </NotePage>
  {:else}
    {#if SubPath === '#/Legal'}
      <LegalPage/>
    {:else}
      <InfoPage>
        {#if $Globals.State === 'Login'}         <Overlay><LoginDialog/></Overlay>{/if}
        {#if $Globals.State === 'loggingIn'}     <Overlay><LoggingInDisplay/></Overlay>{/if}
        {#if $Globals.State === 'LoginFailure'}  <Overlay><LoginFailureDisplay/></Overlay>{/if}
        {#if $Globals.State === 'ResetRequest'}  <Overlay><ResetRequestDialog/></Overlay>{/if}
        {#if $Globals.State === 'ResetRequested'}<Overlay><ResetRequestSuccessDisplay/></Overlay>{/if}
        {#if $Globals.State === 'CommunicationFailure'}<Overlay><CommunicationFailureDisplay/></Overlay>{/if}
      </InfoPage>
    {/if}
  {/if}
</ApplicationCell>
