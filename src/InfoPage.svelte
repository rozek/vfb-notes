<style>
  .InfoPage {
    display:flex; flex-flow:column nowrap; align-items:stretch;
    display:relative; width:100%; height:100%;
  }

  .NavigationBar {
    display:flex; flex:0 0 auto;
    width:100%; height:44px;
    border:none; border-bottom:solid 1px black;
    font-size:18px; font-weight:bold;
  }

  .NavigationBarTitle {
    display:block; position:absolute;
    width:100%; height:44px;
    text-align:center; line-height:44px;
    pointer-events:none;
  }

  .ContentArea {
    display:block; flex:1 1 auto;
  }
</style>

<div class="InfoPage">
  <div class="NavigationBar">
    <div class="NavigationBarTitle">VfB-Notes</div>
  </div>
  <div class="ContentArea">
  </div>

  <slot></slot>
</div>