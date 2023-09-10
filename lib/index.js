const express = require('express')
const { randomUUID } = require('node:crypto')
const { readFileSync } = require('node:fs')
const puppeteer = require('puppeteer')
const paddleIntegration = require('@discue/paddle-integration-mongodb')

/**
 * @typedef {object} CheckoutResult
 * @property {string} checkout_id
 * @property {string} image_url
 * @property {string} title
 */

/**
 * @typedef {object} OrderCompletedResult
 * @property {string} date
 * @property {number} timezone_type
 * @property {string} timezone
 */

/**
 * @typedef {object} OrderCustomerResult
 * @property {string} email
 * @property {boolean} marketing_consent
 */

/**
 * @typedef {object} OrderAccessManagementResult
 * @property {Array.<string>} software_key
 */

/**
 * @typedef {object} OrderResult
 * @property {number} order_id
 * @property {string} total
 * @property {string} total_tax
 * @property {string} currency
 * @property {number} quantity
 * @property {string} formatted_total
 * @property {string} formatted_tax
 * @property {string} coupon_code
 * @property {OrderCompletedResult} completed
 * @property {string} receipt_url
 * @property {string} customer_success_redirect_url
 * @property {boolean} has_locker
 * @property {OrderCustomerResult} customer
 * @property {boolean} is_subscription
 * @property {number} product_id
 * @property {number} subscription_id
 * @property {string} subscription_order_id
 * @property {OrderAccessManagementResult} access_management
 */

/**
 * @typedef {object} CreateSubscriptionResult
 * @property {OrderResult} order
 * @property {CheckoutResult} checkout
 */

/**
 * @typedef {import('puppeteer').Browser} Browser
 */

/**
 * @typedef ServerOptions
 * @property {number} [serverPort=9876]
 */

/**
 * @typedef PaddleOptions
 * @property {string} vendorId
 * @property {string} productId
 */

/**
 * @type {string}
 */
const page = readFileSync(__dirname + '/page.html', 'utf-8')

/**
 * @param {ServerOptions} options
 * @returns {import('http').Server}
 */
function startServer({ serverPort }) {
    const app = express()

    app.get('/', (_, res) => {
        res.header('content-type', 'text/html').status(200).send(page)
    })

    return app.listen(serverPort)
}

/**
 * @param {import('puppeteer').PuppeteerLaunchOptions} [options]
 * @returns {Browser}
 */
async function launchBrowser(options = {}) {
    if (!options.slowMo) {
        options.slowMo = 50
    }
    return puppeteer.launch(options)
}

/**
 * 
 * @param {object} options 
 * @param {Browser} options.browser
 * @param {number} options.vendorId
 * @param {string} options.productId
 * @param {string} options.serverPort
 * @returns 
 */
async function createSubscription({ browser, serverPort, vendorId, productId }) {
    const page = await browser.newPage()
    const id = randomUUID()
    await page.goto(`http://127.0.0.1:${serverPort}?id=${id}&vendorId=${vendorId}&productId=${productId}`)
    await page.waitForTimeout(1000)

    const frame = await page.waitForFrame(async frame => {
        return frame.name() === 'paddle_frame';
    })
    await frame.waitForSelector('[data-testid="postcodeInput"]')

    page.on('dialog', async dialog => {
        await dialog.dismiss()
    })

    page.on('prompt', async dialog => {
        await dialog.dismiss()
    })

    const enterData = async () => {
        const input = await (frame.$('[data-testid="postcodeInput"]'))
        await input.type('12345')
        await input.press('Enter')

        await frame.waitForSelector('[data-testid="cardNumberInput"]')
        const cardInput = await (frame.$('[data-testid="cardNumberInput"]'))
        await cardInput.type('4242 4242 4242 4242')

        const cardNameInput = await (frame.$('[data-testid="cardholderNameInput"]'))
        await cardNameInput.type('Muller')

        const nextYear = new Date().getUTCFullYear() + 1
        const cardExpiryMonthInput = await (frame.$('[data-testid="expiryDateField"]'))
        await cardExpiryMonthInput.type('12 / ' + nextYear)

        const cardVerificationInput = await (frame.$('[data-testid="cardVerificationValueInput"]'))
        await cardVerificationInput.type('123')
        await cardVerificationInput.press('Enter')
    };

    const result = await new Promise((resolve) => {
        page.exposeFunction('testCallback', resolve)
        enterData().catch(e => console.log(e))
    })

    return result
}

/**
 * @param {object} options
 * @param {number} options.vendorId
 * @param {string} options.productId
 * @param {string} options.serverPort=9876
 * @returns {CreateSubscriptionResult}
 */
module.exports.createActivePaddleSubscription = async function ({ serverPort = 9876, vendorId, productId }) {
    const server = startServer({ serverPort })
    const browser = await launchBrowser()

    try {
        const { checkout, order } = await createSubscription({ browser, serverPort, vendorId, productId })

        return { checkout, order }
    } finally {
        server?.close()
        browser?.close()
    }
}

/**
 * @param {object} options
 * @param {number} options.vendorId
 * @param {string} options.authCode
 * @returns {Promise}
 */
module.exports.cancelTestSubscriptions = async function ({ vendorId, authCode }) {
    const subscriptionApi = new paddleIntegration.Api({
        vendorId,
        authCode,
        useSandbox: true
    })

    const subscriptions = await subscriptionApi.listSubscriptions()

    let count = 0
    for (let i = 0; i < subscriptions.length; i++) {
        const subscription = subscriptions[i]
        const { user_email: email } = subscription
        if (email.endsWith('dsq-paddle-test-kit.com')) {
            count++
            await subscriptionApi.cancelSubscription(subscription)
        }
    }
    console.log(`Cancelled ${count} subscriptions`)
}