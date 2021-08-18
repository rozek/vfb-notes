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

  .Dialog a, .Dialog a:visited {
    color:#2980B9;
    text-decoration:underline;
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
</script>

<script lang="ts">
  function closeMessage (Event) {
    Event.preventDefault()
    Globals.define('State','')
  }
</script>

<div class="Dialog">
  <div>
    <div name="Title">Communication Failure</div>

    <div class="Block">
      Network communication with <a href="https://voltcloud.io/">VoltCloud.io</a>
      failed for the following reason:
    </div>

    <div class="Block" style="
      margin:0px 10px 10px 10px; font-size:12px; font-style:italic; color:red
    ">
      {$Globals.FailureReason}
    </div>

    <div class="Block">
      The best course of action will be to try again later.
    </div>

    <button on:click={closeMessage}>Ok</button>
  </div>
</div>
