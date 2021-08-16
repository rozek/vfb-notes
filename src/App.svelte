<style>
  :global(*) {
    -moz-box-sizing:border-box; -webkit-box-sizing:border-box; box-sizing:border-box;
  }
</style>

<script context="module" lang="ts">
  import { Globals }     from './Globals.js'
  import ApplicationCell from './ApplicationCell.svelte'
  import InfoPage        from './InfoPage.svelte'
  import NotePage        from './NotePage.svelte'
</script>

<script lang="ts">
  let completeURL = document.location.href
  switch (true) {
    case (completeURL.indexOf('/#/confirm/') > 0):
      Globals.define('ConfirmationToken',completeURL.replace(/^.*\/\#\/confirm\//,'')); break
    case (completeURL.indexOf('/#/reset/') > 0):
      Globals.define('ResetToken',       completeURL.replace(/^.*\/\#\/reset\//,''))
  }

  Globals.define({
    AccessToken: sessionStorage['vfb-notes: access-token'],
    EMailAddress:  localStorage['vfb-notes: email-address'],
    Password:    sessionStorage['vfb-notes: password']
  })

  switch (true) {
    case ($Globals.ConfirmationToken != null):
      Globals.define('State','UserConfirmation'); break
    case ($Globals.ConfirmationToken != null):
      Globals.define('ResetToken','PasswordReset'); break
  }

</script>

<ApplicationCell>
  {#if $Globals.AccessToken == null}
    <InfoPage>
    </InfoPage>
  {:else}
    <NotePage>
    </NotePage>
  {/if}
</ApplicationCell>
