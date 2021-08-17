<style>
  .Overlay {
    display:flex; flex-flow:column nowrap; justify-content:center; align-items:center;
    position:absolute; left:0px; top:0px; width:100%; height:100%;
    background-color:rgb(0,0,0,0.2);
  }
</style>

<div class="Overlay">
  <slot></slot>
</div>