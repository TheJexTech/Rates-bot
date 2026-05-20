require('dotenv').config();
const axios = require('axios');
const cron = require('node-cron');

const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const RECIPIENTS = process.env.RECIPIENT_NUMBERS.split(',');

async function getBybitRate() {
  try {
    const response = await axios.post(
      'https://api2.bybit.com/fiat/otc/item/online',
      {
        tokenId: 'USDT',
        currencyId: 'NGN',
        payment: [],
        side: '1',
        size: '10',
        page: '1',
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
    const items = response.data.result.items;
    if (items && items.length > 0) {
      return (parseFloat(items[0].price) - 4).toFixed(2);
    }
    return null;
  } catch (error) {
    console.log('Error fetching rate:', error.message);
    return null;
  }
}

async function sendWhatsAppMessage(rate) {
  const now = new Date().toLocaleTimeString('en-NG', {
    timeZone: 'Africa/Lagos',
    hour: '2-digit',
    minute: '2-digit',
  });

  const message = `💱 *USDT/NGN Rate Update*\n\n🕐 Time: ${now}\n💰 Selling Rate: ₦${rate} per USDT\n\n📊 Source: Bybit P2P\n\n_Rates may vary slightly._`;

  for (const recipient of RECIPIENTS) {
    try {
      await axios.post(
        `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: 'whatsapp',
          to: recipient.trim(),
          type: 'text',
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(`Message sent to ${recipient} at ${now} with rate N${rate}`);
    } catch (error) {
      console.log(`Error sending to ${recipient}:`, error.message);
      console.log('Full error:', JSON.stringify(error.response?.data, null, 2));
    }
  }
}

async function sendRateUpdate() {
  console.log('Fetching Bybit rate...');
  const rate = await getBybitRate();
  if (rate) {
    await sendWhatsAppMessage(rate);
  } else {
    console.log('Could not fetch rate.');
  }
}

cron.schedule('0 8 * * *', sendRateUpdate, { timezone: 'Africa/Lagos' });
cron.schedule('0 12 * * *', sendRateUpdate, { timezone: 'Africa/Lagos' });
cron.schedule('0 18 * * *', sendRateUpdate, { timezone: 'Africa/Lagos' });

console.log('Rates bot is running...');
console.log('Scheduled for 8am, 12pm, and 6pm Lagos time');

sendRateUpdate();
