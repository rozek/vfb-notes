  import { writable } from 'svelte/store'

  import { hash, secretbox } from 'tweetnacl'

  const { subscribe, set, update } = writable({
    ApplicationURL:    'https://vfb-notes.volt.live/',
    ApplicationId:     'd3CX6D',
    AccessToken:       '',
    ConfirmationToken: '',
    ResetToken:        '',
    EMailAddress:      localStorage['vfb-notes: email-address']  || '',
    Password:          '',
    loggedIn:          false,
    firstName:         '',
    lastName:          '',
    State:             '',
    EncryptionKey:     undefined,
    FailureReason:     ''
  })

  function define (KeyOrObject, Value) {
    if (typeof(KeyOrObject) === 'string') {
      update((Globals) => { Globals[KeyOrObject] = Value; return Globals })
      switch (KeyOrObject) {
        case 'EMailAddress':  localStorage['vfb-notes: email-address'] = Value; break
        case 'Password':
          let PasswordHash  = hash(new TextEncoder().encode(Value))
          let EncryptionKey = PasswordHash.slice(0,secretbox.keyLength)
          update((Globals) => { Globals['EncryptionKey'] = EncryptionKey; return Globals })
      }
    } else {
      update((Globals) => Object.assign(Globals,KeyOrObject))

      if ('EMailAddress' in KeyOrObject) {
        localStorage['vfb-notes: email-address'] = KeyOrObject['EMailAddress']
      }

      if ('Password' in KeyOrObject) {
        let PasswordHash  = hash(new TextEncoder().encode(KeyOrObject['Password']))
        let EncryptionKey = PasswordHash.slice(0,secretbox.keyLength)
        update((Globals) => { Globals['EncryptionKey'] = EncryptionKey; return Globals })
      }
    }
  }

  export const Globals = { subscribe, define }
