# vfb-notes #

"[VfB-Notes](https://vfb-notes.volt.live/#/)" is a trivial demonstrator for the [voltcloud-for-browsers](https://github.com/rozek/voltcloud-for-browsers) library.

[VoltCloud.io](https://voltcloud.io/) is a simple (and reasonably priced) deployment server for web applications with integrated user management and key-value stores for both the application itself and any of its users.

[voltcloud-for-browsers](https://github.com/rozek/voltcloud-for-browsers) is a simple client library for web applications which need access to VoltCloud and its functions.

This demonstrator implements all user management processes VoltCloud offers - ranging from user registration, email confirmation, password reset up to user login, account management and, last not least, account deletion.

The service this application provides is, on the other hand, rather trivial: registered users will be able to edit a single page of online text notes from their smartphones (or tablets, desktops or notebooks)

This "service" is provided free of charge on a "best-effort" basis.


## Build Instructions ##

You may easily build this package yourself.

Just install [NPM](https://docs.npmjs.com/) according to the instructions for your platform and follow these steps:

1. either clone this repository using [git](https://git-scm.com/) or [download a ZIP archive](https://github.com/rozek/vfb-notes/archive/refs/heads/main.zip) with its contents to your disk and unpack it there 
2. open a shell and navigate to the root directory of this repository
3. run `npm install` in order to install the complete build environment
4. execute `npm run build` to create a new build or
5. execute `npm run dev` to start a local server for this demonstrator with hot-reload capabilities which may thus be used during development

If you made some changes to the source code, you may also try

```
npm run agadoo
```

in order to check if the result is still tree-shakable.

You may also look into the author's [build-configuration-study](https://github.com/rozek/build-configuration-study) for a general description of his build environment.

## License ##

[MIT License](LICENSE.md)

