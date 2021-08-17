#!/usr/bin/env node
//----------------------------------------------------------------------------//
//                            uploads "vfb-notes"                             //
//----------------------------------------------------------------------------//

  import {
    actOnBehalfOfDeveloper, focusOnApplicationCalled, uploadToApplication
  } from 'voltcloud-for-nodejs'

  import JSZip from 'jszip'

  import path from 'path'
  import  fs  from 'fs'

  const ApplicationName = 'vfb-notes'

/**** fetch required environment variables ****/

  const DeveloperAddress = process.env.developer_email_address
  if (DeveloperAddress == null) {
    console.error(
      'please, set environment variable "developer_email_address" to the ' +
      'email address of a VoltCloud application developer'
    )
    process.exit(1)
  }

  const DeveloperPassword = process.env.developer_password
  if (DeveloperPassword == null) {
    console.error(
      'please, set environment variable "developer_password" to the ' +
      'password of a VoltCloud application developer'
    )
    process.exit(2)
  }

/**** build (and save) archive ****/

  const DistFolder = path.join(process.cwd(),'dist')

  let Archive = await (
    JSZip()
      .file('index.html',  fs.readFileSync(path.join(DistFolder,'index.html')))
      .file('index.js',    fs.readFileSync(path.join(DistFolder,'index.js')))
      .file('index.js.map',fs.readFileSync(path.join(DistFolder,'index.js.map')))
      .generateAsync({ type:'nodebuffer' })
  )
  fs.writeFileSync(
    path.join(process.cwd(),ApplicationName + '.zip'), Archive
  )

/**** upload archive ****/

  await actOnBehalfOfDeveloper(DeveloperAddress,DeveloperPassword)
  await focusOnApplicationCalled(ApplicationName)
  await uploadToApplication(Archive)

