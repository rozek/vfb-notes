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
  import LoggingInMessage            from './LoggingInMessage.svelte'
  import LoginFailureMessage         from './LoginFailureMessage.svelte'
  import CommunicationFailureMessage from './CommunicationFailureMessage.svelte'
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

Globals.define('State','LoginFailure')

  let SubPath = document.location.hash
  window.addEventListener(
    'hashchange', () => { SubPath = document.location.hash }
  )
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
        {#if $Globals.State === 'Login'}       <Overlay><LoginDialog/></Overlay>{/if}
        {#if $Globals.State === 'LoggingIn'}   <Overlay><LoggingInMessage/></Overlay>{/if}
        {#if $Globals.State === 'LoginFailure'}<Overlay><LoginFailureMessage/></Overlay>{/if}
        {#if $Globals.State === 'CommunicationFailure'}<Overlay><CommunicationFailureMessage/></Overlay>{/if}
      </InfoPage>
    {/if}
  {/if}
</ApplicationCell>
