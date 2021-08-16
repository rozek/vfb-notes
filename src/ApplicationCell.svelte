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
  import { constrained } from 'javascript-interface-library'
  import    Viewport     from 'svelte-viewport-info'
</script>

<script lang="ts">
  let CellX = 0, CellWidth  = 320
  let CellY = 0, CellHeight = 480

  let isFullScreen = false

  function resizeApplicationCell () {
    let ViewportWidth  = Viewport.Width
    let ViewportHeight = Viewport.Height

    CellWidth  = constrained(ViewportWidth,  320,480)
    CellHeight = constrained(ViewportHeight, 480,896)

    CellX = Math.max(0, (ViewportWidth-CellWidth)/2)
    CellY = Math.max(0,(ViewportHeight-CellHeight)/2)

    isFullScreen = (
      (ViewportWidth  >= 320) && (ViewportWidth  <= 480) &&
      (ViewportHeight >= 480) && (ViewportHeight <= 896)
    )
  }
  resizeApplicationCell()
</script>

<svelte:body
  on:viewportchanged={resizeApplicationCell}
  on:orientationchangeend={resizeApplicationCell}
/>

<div class="ApplicationCell" class:isFullScreen style="
  left:{CellX}px; top:{CellY}px;
  width:{CellWidth}px; height:{CellHeight}px;
">
  <slot></slot>
</div>
