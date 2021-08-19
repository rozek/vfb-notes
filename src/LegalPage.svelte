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



  .ContentArea .Block {
    display:block; margin:20px;
    text-align:justify;
  }

  .ContentArea .Block ul {
    margin-left:20px; padding-left:0px;
  }

  .ContentArea .Block ul ul {
    margin-left:10px; padding-left:0px;
  }
</style>

<script lang="ts">
  function showInfo () { document.location.hash = '#/' }
</script>

<div class="Page">
  <div class="NavigationBar">
    <div class="left Button" on:click|preventDefault={showInfo}><span class="Caret">⟨</span> Back</div>
    <div class="Title">VfB-Notes - Legal</div>
    <div class="right Button"/>
  </div>
  <div class="ContentArea">
    <div class="Block">
      "VfB-Notes" is a simple application hosted at and using additional
      services offered by <a href="https://voltcloud.io/">VoltCloud.io</a>.
      As a consequence, at first, the VoltCloud
      <a href="https://www.appstudio.dev/app/legal/legal.php">Privacy Policy</a>
      and
      <a href="https://www.appstudio.dev/app/legal/legal.php">Terms of Service</a>
      apply.
    </div>

    <div class="Block">
      <h4>Logging</h4>

      "VfB-Notes" itself does not perform any logging.
    </div>

    <div class="Block">
      <h4>Cookies and other Data stored in a Browser</h4>

      "VfB-Notes" does not use cookies. It does, however, store your email
      address locally in the browser (in an area called "localstorage"). It will
      be kept there until explicitly deleted, but will not be accessible
      outside this browser or for web pages from other sites.
    </div>

    <div class="Block">
      <h4>Data Privacy</h4>

      The developer of this application has insight into

      <ul>
        <li>
          your account, which was created to use this application
          (including your email address, your first and last name and wether
          your account has been confirmed or not)
          <br>&nbsp;<br>
          <i>The developer will never use this knowledge to send you unrequested
          messages nor will he disclose that information to other parties!</i>
          <br>&nbsp;<br>
        </li>
        <li>
          the notes you create
          <br>&nbsp;<br>
          <i>For that reason, "VfB-Notes" always encrypts your notes using your
          password. Please note: your notes may become unreadable if you
          change your password using the VoltCloud "password reset" mechanism!</i>
        </li>
      </ul>

      The developer does <b>not</b> know your password, nor is he able to
      decrypt the notes you create.
    </div>

    <div class="Block">
      <h4>Data Removal</h4>

      As soon as you delete your account, all information about you (including
      any notes you created) will immediately become inaccessible for the
      developer - and will eventually be removed from VoltCloud in the course
      of their processes.
    </div>
  </div>
</div>