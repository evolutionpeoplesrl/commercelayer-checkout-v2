import _ from 'lodash'
import axios from 'axios'

export const collectBrowserInfo = () => {
  const screenWidth = window && window.screen ? window.screen.width : ''
  const screenHeight = window && window.screen ? window.screen.height : ''
  const colorDepth = window && window.screen ? window.screen.colorDepth : ''
  const userAgent = window && window.navigator ? window.navigator.userAgent : ''
  const javaEnabled =
    window && window.navigator ? navigator.javaEnabled() : false

  let language = ''
  if (window && window.navigator) {
    language = window.navigator.language
      ? window.navigator.language
      : window.navigator.browserLanguage // Else is for IE <+ 10
  }

  const d = new Date()
  const timeZoneOffset = d.getTimezoneOffset()

  const browserInfo = {
    screenWidth,
    screenHeight,
    colorDepth,
    userAgent,
    timeZoneOffset,
    language,
    javaEnabled
  }

  return browserInfo
}

export const getCurrentStep = order => {
  let step = getRequiresPayment(order) ? 3 : 2

  if (
    _.isEmpty(order.customer_email) ||
    _.isEmpty(order.billing_address.first_name) ||
    _.isEmpty(order.shipping_address.first_name)
  ) {
    step = 1
  } else {
    _.each(order.shipments, shipment => {
      if (_.isEmpty(shipment.shipping_method)) step = 2
    })
  }

  return step
}

export const getRequiresDelivery = order => {
  return !_.isEmpty(skuLineItems(order))
}

export const getRequiresPayment = order => {
  return order.total_amount_with_taxes_float > 0
}

export const getGiftCardOrCouponApplied = order => {
  return !_.isEmpty(order.gift_card_or_coupon_code)
}

export const skuLineItems = order => {
  return _.filter(order.line_items, { item_type: 'skus' })
}

// not used
export const clearPaymentScripts = () => {
  let scripts = document.getElementsByClassName('payment-script')
  _.each(scripts, el => {
    el.parentNode.removeChild(el)
  })
}

// used to get ip by calling remote server
export const getJSONP = (url, success) => {
  let ud = '_' + +new Date()
  let script = document.createElement('script')
  let head = document.getElementsByTagName('head')[ 0 ] || document.documentElement

  window[ ud ] = function (data) {
    head.removeChild(script)
    success && success(data)
  }

  script.src = url.replace('callback=?', 'callback=' + ud)
  head.appendChild(script)
}

// retrieve client IP by calling jsonip.com service
export const getClientIP = () => {
  return new Promise((resolve, reject) => getJSONP('https://jsonip.com/?callback=?', data => resolve(data.hasOwnProperty('ip') ? data.ip : 'unknown')))
}

// send purchase event to facebook api
export const sendPurchaseEventToFacebookAPI = () => {
  getClientIP().then(result => {
    const ip = result
    const orderAmount = Number(document.getElementById('order-summary-total-amount').textContent.replace(/[^0-9,-]+/g, '').replace(',', '.'))
    const data = JSON.stringify({
      'data': [
        {
          'event_name': 'Purchase',
          'event_time': Math.floor(+new Date() / 1000),
          'action_source': 'website',
          'event_source_url': window.location.href,
          'user_data': {
            'client_ip_address': ip,
            'client_user_agent': window.navigator.userAgent
          },
          'custom_data': {
            'currency': 'EUR',
            'value': orderAmount
          }
        }
      ]
    })

    const config = {
      method: 'post',
      url: 'https://graph.facebook.com/v12.0/369407189935534/events?access_token=EAAVny3PwrEYBAFFMIzXttidrcK1tF2Df05uwTbJdRmSR3Ost9fSIjNjZByJmBH8FgbsfMYLOLVkZASuzhZBSbVwSCOSZCFi78m123WuNJuTitVRGlmm4ZAh2GZCNrT0baKivfO32oIRQxzj9e9fIaEvsEvKDM5UsVd5MaFsJXr3N4ooMMrSZC3ZC8hXrnW8RbgQZD',
      headers: {
        'Content-Type': 'application/json'
      },
      data: data
    }

    axios(config)
      .then(function (response) {
        console.log(JSON.stringify(response.data))
      })
      .catch(function (error) {
        console.log(error)
      })
  })
}
