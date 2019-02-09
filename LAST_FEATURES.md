
*Features*
- ```new WSP({ url: '/lalala' })``` is now the same as ```new WSP({ url: `${location.hostname}:${location.port}/lalala` })```. Throws in non-browsers.
- ~0.5Kb less bundle size.

*Underhood*
- Much faster id generation, shorter ids with unicode 48 -> 122.
- cleanup, tests structure heavily improved.
- Upgrade deps including ava test runner.