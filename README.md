
<p align="center">
<a href="https://www.discue.io/" target="_blank" rel="noopener noreferrer"><img width="128" src="https://www.discue.io/icons-fire-no-badge-square/web/icon-192.png" alt="Vue logo">
</a>
</p>

<br/>
<div align="center">

[![GitHub tag](https://img.shields.io/github/tag/discue/paddle-test-kit?include_prereleases=&sort=semver&color=blue)](https://github.com/discue/paddle-test-kit/releases/)
[![Latest Stable Version](https://img.shields.io/npm/v/@discue/paddle-test-kit.svg)](https://www.npmjs.com/package/@discue/paddle-test-kit)
[![License](https://img.shields.io/npm/l/@discue/paddle-test-kit.svg)](https://www.npmjs.com/package/@discue/paddle-test-kit)
<br/>
[![NPM Downloads](https://img.shields.io/npm/dt/@discue/paddle-test-kit.svg)](https://www.npmjs.com/package/@discue/paddle-test-kit)
[![NPM Downloads](https://img.shields.io/npm/dm/@discue/paddle-test-kit.svg)](https://www.npmjs.com/package/@discue/paddle-test-kit)
<br/>
[![contributions - welcome](https://img.shields.io/badge/contributions-welcome-blue)](/CONTRIBUTING.md "Go to contributions doc")
[![Made with Node.js](https://img.shields.io/badge/Node.js->=18-blue?logo=node.js&logoColor=white)](https://nodejs.org "Go to Node.js homepage")

</div>

# paddle-test-kit

Test kit for [paddle.com](https://www.paddle.com/) payments.

This module provides 
- a function to create an active paddle subscription for testing purposes

## Installation
```bash
npm install @discue/paddle-test-kit
```

### Creating a new subscription
The module is able to create a new Paddle subscription for a given `vendor_id`. The module will start a puppeteer instance in the background, generate a checkout page with `inline` mode and finish the checkout process. 

For the webhooks integration to work and to be able to correlate incoming hooks with the correct subscription, a placeholder needs to be created **before the checkout** and - afterward - a specific value must be passed to the [Checkout API](https://developer.paddle.com/guides/ZG9jOjI1MzU0MDQz-pass-parameters-to-the-checkout) via the `passthrough` parameter. This value will be returned by the `addSubscriptionPlaceholder` method.

```js
'use strict'

const { createActivePaddleSubscription } = require('../lib/index.js')

const productId = 36631 // the product id is vendor specific
const vendorId = process.env.VENDOR_ID

const { checkout, order } = await createActivePaddleSubscription({
    productId,
    vendorId
})

const { subscription_id } = order
```

### Removing test subscriptions
The exported function `cancelTestSubscriptions` cancels all active subscriptions created by this module.

```js
'use strict'

const { cancelTestSubscriptions } = require('../lib/index.js')

await cancelTestSubscriptions() // requires env var AUTH_CODE
```

## License

[MIT](https://choosealicense.com/licenses/mit/)

