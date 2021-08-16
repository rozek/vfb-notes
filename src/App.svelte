<style>
  :global(*) {
    -moz-box-sizing:border-box; -webkit-box-sizing:border-box; box-sizing:border-box;
  }

  .ApplicationCell {
    display:block; position:absolute; overflow:hidden;
    width:320px; height:480px;
    margin:0px; padding:0px;
    border:solid 8px black; border-radius:20px;
    box-shadow:0px 0px 16px 0px rgba(0,0,0,0.5);
    background:white;

    font-family:'Source Sans Pro','Helvetica Neue',Helvetica,Arial,sans-serif;
    font-size:14px; font-weight:400; color:black;
    line-height:150%;
  }

  .isFullScreen {
    border:none; border-radius:0px;
  }
</style>

<script context="module" lang="ts">
  import ApplicationCell from './ApplicationCell.svelte'
</script>

<script lang="ts">
</script>

<ApplicationCell>
</ApplicationCell>
