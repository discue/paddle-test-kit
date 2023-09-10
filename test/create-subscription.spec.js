const { expect } = require('chai')
const { createActivePaddleSubscription, cancelTestSubscriptions } = require('../lib/index.js')

describe('CreateSubscription', () => {
    const productId = 36631
    const vendorId = process.env.VENDOR_ID

    after(cancelTestSubscriptions)

    it('returns the checkout object', async () => {
        const { checkout, order } = await createActivePaddleSubscription({
            productId,
            vendorId
        })

        new URL(checkout.image_url) // check its a valid url
        expect(checkout.title).to.equal('Medium')
        expect(checkout.checkout_id).to.match(/^[0-9a-z-]{20,40}$/)
        console.log({ checkout, order })
    })

    it('returns the order object', async () => {
        const { order } = await createActivePaddleSubscription({
            productId,
            vendorId
        })

        expect(order.order_id).to.be.a('number')
        expect(order.total).to.match(/^[0-9]{1,2}\.[0-9]{2}$/)
        expect(order.total_tax).to.match(/^[0-9]{1,2}\.[0-9]{2}$/)
        expect(order.currency).to.match(/(^EUR$|^USD$)/)
        expect(order.quantity).to.equal(1)
        expect(order.formatted_total).to.match(/^(€|US\$)[0-9]{1,2}\.[0-9]{2}$/)
        expect(order.formatted_tax).to.match(/^(€|US\$)[0-9]{1,2}\.[0-9]{2}$/)
        expect(order.coupon_code).to.be.null
        expect(order.completed.date).to.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}/)
        expect(order.completed.timezone).to.equal('UTC')
        expect(order.completed.timezone_type).to.be.a('number')
        new URL(order.receipt_url)
        expect(order.customer_success_redirect_url).to.be.empty
        expect(order.customer.email).to.match(/@dsq-paddle-test-kit.com$/)
        expect(order.is_subscription).to.be.true
        expect(order.product_id).to.equal(productId)
        expect(order.subscription_id).to.be.a('number')
    })
})